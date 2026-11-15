#include "Motor.h"
#include "Sequencer.h"
#include "TestSong.h"
#include "SpeakerAudio.h"
#include "Notes.h"

// pin I2S assignment & motor setup
const int stpPin[10] = {17, 13, 4, 6, 8, 10, 15};                          // all step pins here
const int dirPin[10] = {18, 12, 5, 7, 9, 11, 16};                          // all dir pins, dirPins[0] --> dirPin for motor 1, etc.

const int i2sBclkPin = 40;
const int i2sLrcPin  = 41;
const int i2sDataPin = 42;

const int stepsPerRevolution = 200;                      // 200 steps for 360 degrees, 1 step = 1.8 deg

// motor output defines:
#define NUM_OF_MOTORS 3
Motor motors[NUM_OF_MOTORS];                                         // 3 motors, can scale up
const bool TEST_SAMPLES_ONLY = false;                    // false enables motor playlist, always false for regular tests (REMOVE PARAM)

// ------------------------------------------------------------------------------------------------------------------------------------------
// each entry describes one song. NoteEvent arrays stay in TestSong.cpp (THIS WILL BE REMOVED WHEN ECE2/ECE1 INPUTS + TIMELINE ARE INTEGRATED)
struct Song {
  const char* name;
  NoteEvent* events;
  int numEvents;
  unsigned long duration;
};

const Song playlist[] = {
  {"arppegio", arppegio, arppegioLength, arppegioDuration},
  {"melody1", melody1, melody1Length, melody1Duration}
};

const int PLAYLIST_LENGTH = sizeof(playlist) / sizeof(playlist[0]);

int currentSongIndex = 0;
bool songStarted = false;
bool currentSongDone = false;
bool playlistDone = false;

void stopAllMotors() {
  for (int i = 0; i < NUM_OF_MOTORS; i++) {
    stopNote(motors[i]);
  }
}

void startCurrentSong() {
  const Song &song = playlist[currentSongIndex];

  stopAllMotors();

  // previously played arrays must have their event flags cleared for replay
  for (int i = 0; i < song.numEvents; i++) {
    song.events[i].started = false;
    song.events[i].finished = false;
  }

  currentSongDone = false;

  // log while motors are stopped, before starting this song's clock
  Serial.print("Starting song ");
  Serial.print(currentSongIndex + 1);
  Serial.print("/");
  Serial.print(PLAYLIST_LENGTH);
  Serial.print(": ");
  Serial.println(song.name);

  startSequencer();
  songStarted = true;
}
// ------------------------------------------------------------------------------------------------------------------------------------------

void setup() {

  Serial.begin(9600);
  Serial.println("********************************");

  // initialize all motors
  for (int motorNum = 0; motorNum < NUM_OF_MOTORS; motorNum++) {
    initMotor(motors[motorNum], motorNum + 1, stpPin[motorNum], dirPin[motorNum]);
  }

  bool audioReady = beginSpeakerAudio(i2sBclkPin, i2sLrcPin, i2sDataPin);

  if (!audioReady) {
      Serial.println("Speaker setup failed. Motor playback can still run.");
  }

  Serial.println("1/2/3: play percussion | 0: stop sample");

  if (TEST_SAMPLES_ONLY) {
    Serial.println("Sample testing only. Motor playlist is disabled.");
  } else {
    Serial.println("Motor playlist will play once. Press p after it finishes to replay.");
  }
}

void loop() {

    // sends 'p' after the song finishes the play it again
    // Serial.read only runs when a character is already available

    if (Serial.available() > 0) {
      char command = Serial.read();

      // Play one of the three percussion samples
      if (command >= '1' && command <= '3') {
        if (!playSample(command - '0')) {
          Serial.println("Sample request failed.");
        }
      }

      // Stop the currently playing sample
      else if (command == '0') {
        stopSample();
      }

      // the next loop update starts again with the first playlist entry
      else if (command == 'p' && playlistDone && !TEST_SAMPLES_ONLY) {
        currentSongIndex = 0;
        songStarted = false;
        currentSongDone = false;
        playlistDone = false;
      }
    }

  // run the motor sequencer (optional during testing)

  if (!TEST_SAMPLES_ONLY && !playlistDone) {

    if (!songStarted) {
      startCurrentSong();
    }

    const Song &song = playlist[currentSongIndex];

    updateSequencer(
      song.events,
      song.numEvents,
      motors,
      song.duration,
      false,                                            // Each song plays ONCE in this playlist
      currentSongDone
    );

    if (currentSongDone) {
      // Clear any remaining note before switching songs or stopping playback.
      stopAllMotors();
      currentSongIndex++;
      songStarted = false;

      if (currentSongIndex >= PLAYLIST_LENGTH) {
        playlistDone = true;
        Serial.println("Playlist finished. Press p to replay both songs.");
      }

      // Otherwise, the next loop() call starts the next song with a fresh clock.
    }
  }

  // always update motor STEP signals

  for (int i = 0; i < NUM_OF_MOTORS; i++) {
    updateMotor(motors[i]);
  }

  // Other non-blocking tasks can run here
}