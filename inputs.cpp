#include "inputs.h"

static volatile Mode current_mode = MODE_RECORD;

// ----- Helper functions -----

static void buttons_poll() { // Can hijack this for the encoder button

}

static void switch_poll() {

}

static void encoder_poll() {

}

// ----- Main functions -----

void inputs_init() {
  // Set pinmodes
  // Start hardware pulse counter for encoder
  // Set current_mode for switch position
  // Set debounce state for buttons
}

void inputs_loop() {
  buttons_poll();
  switch_poll();
  encoder_poll();

  // Check if something meaningful changed, push to event queue
}

Mode inputs_get_mode() {
  return current_mode;
}
