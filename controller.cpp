#include "controller.h"

// ----- Controller owned state -----

static Track tracks[NUM_TRACKS];
static Mode current_mode;
static uint32_t last_tick_ms; // Used for sleeping

// ----- Controlller functions -----

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
  // Poll inputs manager

  // Dequeue events and handle them

  // Update timeouts
}

/*void controller_handle_mode_changed(Mode new_mode) {

}

Mode controller_get_mode() {

}

void controller_handle_track_button(Track *track) {

}

void controller_handle_recording_timeout(Track *track) {

}

void controller_set_track_state(Track *track, TrackState new_state) {

}*/
