#include <Arduino.h>
#include <ESP_I2S.h>
#include <LittleFS.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/queue.h>

#include "SpeakerAudio.h"

// files and private audio state

static const char* SAMPLE_FILES[3] = {
  "/kick.wav",
  "/snare_1.wav",
  "/tom_1.wav"
};

static const uint32_t SAMPLE_RATE = 44100; // 44.1 kHz
static const uint8_t STOP_COMMAND = 0;

static I2SClass i2s;
static QueueHandle_t sampleQueue = nullptr;
static TaskHandle_t speakerTaskHandle = nullptr;

// WAV header helpers. read little-endian int from raw WAV header bytes

/* WAV HEADER:
  * Standard WAV Header Structure (44 Bytes, Little-Endian)
  *
  * 0 - 3   (4 bytes): ChunkID       - "RIFF" (0x52494646)
  * 4 - 7   (4 bytes): ChunkSize     - Overall file size minus 8 bytes (36 + Subchunk2Size)
  * 8 - 11  (4 bytes): Format        - "WAVE" (0x57415645)
  * 12 - 15 (4 bytes): Subchunk1ID   - "fmt " (0x666d7420) - includes trailing space
  * 16 - 19 (4 bytes): Subchunk1Size - 16 for standard PCM
  * 20 - 21 (2 bytes): AudioFormat   - 1 = PCM (uncompressed)
  * 22 - 23 (2 bytes): NumChannels   - 1 = Mono, 2 = Stereo
  * 24 - 27 (4 bytes): SampleRate    - Sampling frequency in Hz (e.g., 44100, 48000)
  * 28 - 31 (4 bytes): ByteRate      - (SampleRate * NumChannels * BitsPerSample) / 8
  * 32 - 33 (2 bytes): BlockAlign    - (NumChannels * BitsPerSample) / 8
  * 34 - 35 (2 bytes): BitsPerSample - Bit depth (e.g., 8, 16, 24)
  * 36 - 39 (4 bytes): Subchunk2ID   - "data" (0x64617461)
  * 40 - 43 (4 bytes): Subchunk2Size - Size of raw audio data payload in bytes
  * 44+     (Var)    : Data          - Interleaved raw PCM audio samples
  *
  * Note: Non-standard WAVs may contain extra subchunks (e.g., LIST, cue, fact)
  * before the "data" chunk. Parse subchunks dynamically rather than hardcoding
  * a 44-byte offset.
 */

static uint16_t get16 (const uint8_t* p) { // reads two consecutive 8-bit bytes from memory and combines them into a single 16-bit unsigned integer using little-endian byte order
  return uint16_t (p[0]) | (uint16_t(p[1]) << 8);
}

static uint32_t get32 (const uint8_t* p) { // reads four consecutive 8-bit bytes from memory and combines them into a single 32-bit unsigned integer using little-endian byte order
  return uint32_t (p[0]) |
         (uint32_t(p[1]) << 8) |
         (uint32_t(p[2]) << 16) |
         (uint32_t(p[3]) << 24);
}

// find the PCM "data" chunk, leaving the file cursor at the first audio sample
static bool findWavData (File & file, uint32_t & bytesRemaining) {
  uint8_t riff[12];

  if (file.read(riff, sizeof(riff)) != sizeof(riff) || memcmp(riff, "RIFF", 4) != 0 || memcmp(riff + 8, "WAVE", 4) != 0) {
    Serial.println("Invalid WAV: missing RIFF/WAVE header.");
    return false;
  }

  bool formatOK = false;

  while (file.available() >= 8) {
    uint8_t chunk [8];

    if (file.read(chunk, sizeof(chunk)) != sizeof(chunk)) {
      return false;
    }

    uint32_t chunkSize = get32(chunk + 4);
    uint32_t chunkStart = file.position();
    uint32_t nextChunk = chunkStart + chunkSize + (chunkSize & 1U);

    if (nextChunk < chunkStart || nextChunk > file.size()) {
      Serial.println("Invalid WAV chunk size.");
      return false;
    }

    // check data formatting chunk:
    if (memcmp(chunk, "fmt ", 4) == 0) {
      if (chunkSize < 16) {
        Serial.println("Invalid WAV format chunk.");
        return false;
      }

      uint8_t fmt[16];
      if (file.read(fmt, sizeof(fmt)) != sizeof(fmt)) {
        return false;
      }

      uint16_t encoding = get16(fmt);       // 1 = standard integer PCM
      uint16_t channels = get16(fmt + 2);   // Must be 1 (mono)
      uint32_t rate = get32(fmt + 4);       // Must be 44100 Hz
      uint16_t bits = get16(fmt + 14);      // Must be 16 bits/sample

      formatOK = encoding == 1 && channels == 1 &&
                 rate == SAMPLE_RATE && bits == 16;

      if (!formatOK) {
        Serial.printf("Unsupported WAV: encoding=%u, channels=%u, "
                      "rate=%lu, bits=%u\n",
                      unsigned(encoding), unsigned(channels),
                      (unsigned long)rate, unsigned(bits));
        Serial.println("Export as 16-bit PCM, mono, 44100 Hz WAV.");
        return false;
      }
    }

    if (memcmp(chunk, "data", 4) == 0) {
      if (!formatOK || (chunkSize % 2) != 0) {
        Serial.println("WAV data found, but format or size is invalid.");
        return false;
      }

      bytesRemaining = chunkSize;
      return true; // Cursor is now at the beginning of the audio samples
    }

    // Skip metadata and any extra format bytes
    if (!file.seek(nextChunk, SeekSet)) {
      return false;
    }
  }

  Serial.println("WAV data chunk not found.");
  return false;
}

// background task: one active WAV at a time

static void speakerTask (void* ) {
  File activeFile;
  uint32_t bytesRemaining = 0;
  uint8_t requestedID = 0;

  // 256 mono PCM samples = 512 bytes (~5.8 ms at 44.1 kHz)
  int16_t buffer[256];

  for (;;) {
    // when idle: sleep until there is a command
    // during playback: check for a new command between audio blocks

    TickType_t waitTime = activeFile ? 0 : portMAX_DELAY;

    if (xQueueReceive(sampleQueue, &requestedID, waitTime) == pdTRUE) {
      if (activeFile) {
        activeFile.close(); // A new hit interrupts the previous hit.
      }

      bytesRemaining = 0;

      if (requestedID != STOP_COMMAND) {
        const char* fileName = SAMPLE_FILES[requestedID - 1];
        activeFile = LittleFS.open(fileName, "r");

        if (!activeFile) {
          Serial.printf("Cannot open %s\n", fileName);
        } else if (!findWavData(activeFile, bytesRemaining)) {
          activeFile.close();
        } else {
          Serial.printf("Playing %s\n", fileName);
        }
      }
    }

    if (!activeFile) {
      continue;
    }

    if (bytesRemaining == 0) {
      activeFile.close();
      continue;
    }

    size_t bytesToRead = bytesRemaining < sizeof(buffer) ? bytesRemaining : sizeof(buffer);

    size_t bytesRead = activeFile.read(reinterpret_cast<uint8_t*>(buffer), bytesToRead);

    if (bytesRead != bytesToRead || (bytesRead % 2) != 0) {
      Serial.println("Error while reading WAV samples.");
      activeFile.close();
      bytesRemaining = 0;
      continue;
    }

    // Keep initial testing quiet: scale PCM amplitude to 25%.
    for (size_t i = 0; i < bytesRead / sizeof(int16_t); ++i) {
      buffer[i] /= 4;
    }

    // Only this background task waits for the I2S hardware.
    // The Arduino motor loop is NOT blocked by this write().
    size_t bytesSent = i2s.write(
      reinterpret_cast<uint8_t*>(buffer), bytesRead
    );

    if (bytesSent != bytesRead) {
      Serial.println("I2S write failed.");
      activeFile.close();
      bytesRemaining = 0;
      continue;
    }

    bytesRemaining -= bytesRead;

    if (bytesRemaining == 0) {
      activeFile.close();
      Serial.println("Sample finished.");
    }
  }
}

// public functions called by main.ino

bool beginSpeakerAudio(int bclkPin, int lrcPin, int dataPin) {
  if (speakerTaskHandle != nullptr) {
    return true; // Already running.
  }

  // Do NOT erase flash automatically if mounting fails.
  if (!LittleFS.begin(false)) {
    Serial.println("LittleFS mount failed. Upload the data folder first.");
    return false;
  }

  // DEBUG: Print every file stored in LittleFS

    Serial.println("Files currently stored in LittleFS:");

    File root = LittleFS.open("/");
    File file = root.openNextFile();

    while (file) {
      Serial.print("File: ");
      Serial.print(file.name());

      Serial.print(" | Size: ");
      Serial.print(file.size());
      Serial.println(" bytes");

      file = root.openNextFile();
    }

    Serial.println("Finished listing files.");

  for (int i = 0; i < 3; ++i) {
    if (!LittleFS.exists(SAMPLE_FILES[i])) {
      Serial.printf("Missing sample: %s\n", SAMPLE_FILES[i]);
      return false;
    }
  }

  i2s.setPins(bclkPin, lrcPin, dataPin);

  // Mono PCM supplied to both left and right I2S slots.
  if (!i2s.begin(
        I2S_MODE_STD,
        SAMPLE_RATE,
        I2S_DATA_BIT_WIDTH_16BIT,
        I2S_SLOT_MODE_MONO,
        I2S_STD_SLOT_BOTH
      )) {
    Serial.println("I2S initialization failed.");
    return false;
  }

  sampleQueue = xQueueCreate(1, sizeof(uint8_t));
  if (sampleQueue == nullptr) {
    Serial.println("Could not create sample queue.");
    i2s.end();
    return false;
  }

  BaseType_t result = xTaskCreatePinnedToCore(
    speakerTask,
    "speakerTask",
    4096,                   // ESP32 FreeRTOS stack size in bytes.
    nullptr,
    1,
    &speakerTaskHandle,
    0                       // Speaker task on core 0.
  );

  if (result != pdPASS) {
    Serial.println("Could not create speaker task.");
    vQueueDelete(sampleQueue);
    sampleQueue = nullptr;
    i2s.end();
    return false;
  }

  Serial.println("Speaker ready for sequenced percussion.");
  return true;
}

bool playSample(uint8_t sampleId) {
  if (sampleId < 1 || sampleId > 3 || sampleQueue == nullptr) {
    return false;
  }

  // Queue size is 1: the newest hit replaces any pending request.
  // The current playback is interrupted when the audio task sees it.
  return xQueueOverwrite(sampleQueue, &sampleId) == pdTRUE;
}

bool stopSample() {
  if (sampleQueue == nullptr) {
    return false;
  }

  uint8_t command = STOP_COMMAND;
  return xQueueOverwrite(sampleQueue, &command) == pdTRUE;
}
