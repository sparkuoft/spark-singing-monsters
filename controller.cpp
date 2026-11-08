#include "controller.h"

#include "events.h"

// ----- Controller owned state -----

static Track tracks[NUM_TRACKS];
static Mode current_mode;
static uint32_t last_tick_ms;  // Used for sleeping

// ----- Controlller functions -----

void volume_encoder(Mode mode, Event current_event, Track tracks[]) {
  Serial.printf("Event (in encoder rec func) 0: type %d, id %u, value %d\n",
                    current_event.type, current_event.id, current_event.value);
  // print encoder soemthing (number)
}

Mode mode_recording(Mode mode, Event current_event, Track tracks[]) {
  if (current_event.type == EVT_BUTTON_PRESSED) {  // check id of value
    if (current_event.id == 0) {
      Serial.printf("Event (in mode rec func) 0: type %d, id %u, value %d\n",
                    current_event.type, current_event.id, current_event.value);
    }
    if (current_event.id == 1) {
      Serial.printf("Event (in mode rec func) 1: type %d, id %u, value %d\n",
                    current_event.type, current_event.id, current_event.value);
    }
    if (current_event.id == 2) {
      Serial.printf("Event (in mode rec func) 2: type %d, id %u, value %d\n",
                    current_event.type, current_event.id, current_event.value);
    }

    mode = MODE_RECORD;  // when event is changed, update tracks array
    Serial.printf("Mode (in mode rec func): Recording\n");
  }

  else if (current_event.type == EVT_MODE_CHANGED) {
    mode = MODE_PLAYBACK;
    Serial.printf("Mode (in func): Switching to Playing due to Button Press\n");

  } else if (current_event.type == EVT_MIC_TIMEOUT) {
    mode = MODE_PLAYBACK;
    Serial.printf("Mode (in func): Switching to Playing due to MIC TIMEOUT\n");
  }

  return mode;
}

Mode mode_playing(Mode mode, Event current_event, Track tracks[]) {
  if (current_event.type == EVT_BUTTON_PRESSED) {
    mode = MODE_PLAYBACK;
    Serial.printf("Mode (in func): Playing\n");
  }

  else if (current_event.type == EVT_MODE_CHANGED) {
    mode = MODE_RECORD;
    Serial.printf("Mode (in func): Switching to Recording\n");
  }

  return mode;
}

Mode mode_sd_occupied(Mode mode, Event current_event, Track tracks[]) {
  Serial.printf("Mode: SD Occupied\n");
  if (current_event.type == EVT_SD_READ) {
    // pass Track Array
  }
  if (current_event.type == EVT_SD_DONE) {
    // will just return when done
  }
  return mode;
}

void controller_debug() {
  Event e;
  while (event_queue_pop(&e)) {
    Serial.printf("Event: type %d, id %u, value %d\n", e.type, e.id, e.value);
    // begin
    if (e.type == EVT_ENCODER) {
      volume_encoder(current_mode, e, tracks);
      Serial.printf("Volume_Encoder\n");
    } else if (current_mode == MODE_RECORD) {
      current_mode = mode_recording(current_mode, e, tracks);
      Serial.printf("Mode: Recording\n");
    }

    else if (current_mode == MODE_PLAYBACK) {
      current_mode = mode_playing(current_mode, e, tracks);
    }

    if (current_mode == MODE_SD_OCCUPIED) {
      current_mode = mode_sd_occupied(current_mode, e, tracks);
    }
    // end
  }
}

void controller_init() {
  // Various init calls from drivers, other subteams

  for (int i = 0; i < NUM_TRACKS; i++) {
    tracks[i].id = i;
    tracks[i].instrument = (InstrumentType)i;
    tracks[i].state = TRACK_EMPTY;
    // Clear leds
  }

  // Call driver to set current_mode

  last_tick_ms = millis();
}

void controller_loop() {
  // DEBUG:
  controller_debug();

  // Poll inputs manager

  // Dequeue events and handle them

  // Update timeouts
}
