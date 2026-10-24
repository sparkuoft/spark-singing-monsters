#include "controller.h"

// ----- Controller owned state -----

static Track tracks[NUM_TRACKS];
static Mode current_mode;
static uint32_t last_tick_ms; // Used for sleeping

// ----- Controlller functions -----A

void controller_debug() {
  Event e;
  while (event_queue_pop(&e)) {
    Serial.printf("Event: type %d, id %u, value %d\n", e.type, e.id, e.value);
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
