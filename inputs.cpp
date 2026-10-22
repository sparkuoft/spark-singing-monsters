#include "inputs.h"
#include "driver/pulse_cnt.h"

static volatile Mode current_mode = MODE_RECORD;

static pcnt_unit_handle_t encoder_unit;

// ----- Helper functions -----

static void encoder_init() {
  pinMode(PIN_VOLUME_A, INPUT_PULLUP);
  pinMode(PIN_VOLUME_B, INPUT_PULLUP); 

  pcnt_unit_config_t unit_config = {
    .high_limit = 1000, // ADD AS CONSTANT
    .low_limit = -1000
  };
  pcnt_new_unit(&unit_config, &encoder_unit);

  pcnt_glitch_filter_config_t filter_config = {
    .max_glitch_ns = 10000 // ADD AS CONSTANT
  };
  pcnt_unit_set_glitch_filter(encoder_unit, &filter_config);

  pcnt_chan_config_t chan_a_config = {
    .edge_gpio_num = PIN_VOLUME_A,
    .level_gpio_num = PIN_VOLUME_B,
  };
  pcnt_channel_handle_t chan_a;
  pcnt_new_channel(encoder_unit, &chan_a_config, &chan_a);

  // chan_b as well

  pcnt_channel_set_edge_action(chan_a, PCNT_CHANNEL_EDGE_ACTION_DECREASE, PCNT_CHANNEL_EDGE_ACTION_INCREASE);
  pcnt_channel_set_level_action(chan_a, PCNT_CHANNEL_LEVEL_ACTION_KEEP, PCNT_CHANNEL_LEVEL_ACTION_INVERSE);
  pcnt_channel_set_edge_action(chan_b, PCNT_CHANNEL_EDGE_ACTION_INCREASE, PCNT_CHANNEL_EDGE_ACTION_DECREASE);
  pcnt_channel_set_level_action(chan_b, PCNT_CHANNEL_LEVEL_ACTION_KEEP, PCNT_CHANNEL_LEVEL_ACTION_INVERSE);

  pcnt_unit_enable(encoder_unit);
  pcnt_unit_clear_count(encoder_unit);
  pcnt_unit_start(encoder_unit);
}

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
