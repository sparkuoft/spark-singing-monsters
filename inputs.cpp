#include "inputs.h"
#include "events.h"
#include "driver/pulse_cnt.h"

static pcnt_unit_handle_t encoder_unit;
static int8_t count_remainder = 0; // Each encoder dedent is 4 counts, need to track partial counts

typedef struct {
  uint8_t pin;
  bool stable; // Indicates if pressed, not GND/VDD
  uint32_t count;
} Input;

static Input track_buttons[NUM_TRACKS] = {
  {PIN_BUTTON_TRACK_1},
  {PIN_BUTTON_TRACK_2},
  {PIN_BUTTON_TRACK_3},
  {PIN_BUTTON_TRACK_4}
};
static Input encoder_button = {PIN_ENCODER_BUTTON};
static Input mode_switch = {PIN_SWITCH_MODE};

// ----- Helper functions -----

static void encoder_init() { // Ripped from ESP-IDF documentation
  pinMode(PIN_ENCODER_A, INPUT_PULLUP);
  pinMode(PIN_ENCODER_B, INPUT_PULLUP); 

  pcnt_unit_config_t unit_config = {
    .high_limit = ENCODER_MAX_COUNT,
    .low_limit = -ENCODER_MAX_COUNT
  };
  pcnt_new_unit(&unit_config, &encoder_unit);

  pcnt_glitch_filter_config_t filter_config = {
    .max_glitch_ns = ENCODER_FILTER
  };
  pcnt_unit_set_glitch_filter(encoder_unit, &filter_config);

  pcnt_chan_config_t chan_a_config = {
    .edge_gpio_num = PIN_ENCODER_A,
    .level_gpio_num = PIN_ENCODER_B,
  };
  pcnt_channel_handle_t chan_a;
  pcnt_new_channel(encoder_unit, &chan_a_config, &chan_a);

  pcnt_chan_config_t chan_b_config = {
    .edge_gpio_num = PIN_ENCODER_B,
    .level_gpio_num = PIN_ENCODER_A,
  };
  pcnt_channel_handle_t chan_b;
  pcnt_new_channel(encoder_unit, &chan_b_config, &chan_b);

  pcnt_channel_set_edge_action(chan_a, PCNT_CHANNEL_EDGE_ACTION_DECREASE, PCNT_CHANNEL_EDGE_ACTION_INCREASE);
  pcnt_channel_set_level_action(chan_a, PCNT_CHANNEL_LEVEL_ACTION_KEEP, PCNT_CHANNEL_LEVEL_ACTION_INVERSE);
  pcnt_channel_set_edge_action(chan_b, PCNT_CHANNEL_EDGE_ACTION_INCREASE, PCNT_CHANNEL_EDGE_ACTION_DECREASE);
  pcnt_channel_set_level_action(chan_b, PCNT_CHANNEL_LEVEL_ACTION_KEEP, PCNT_CHANNEL_LEVEL_ACTION_INVERSE);

  pcnt_unit_enable(encoder_unit);
  pcnt_unit_clear_count(encoder_unit);
  pcnt_unit_start(encoder_unit);
}

static int encoder_poll() {
  int32_t count = 0;
  pcnt_unit_get_count(encoder_unit, &count);
  pcnt_unit_clear_count(encoder_unit);

  int32_t steps = (count + count_remainder) / 4;
  count_remainder = (count + count_remainder) % 4;

  return steps;
}

static void gpio_init(Input *in) {
  pinMode(in->pin, INPUT_PULLUP);
  in->stable = (digitalRead(in->pin) == LOW);
  in->count = 0;
}

static bool gpio_poll(Input *in) {
  bool curr = (digitalRead(in->pin) == LOW);

  if (curr == in->stable) {
    in->count = 0;
    return false;
  }
  
  if (++in->count < DEBOUNCE_COUNT) {
    return false;
  }

  in->stable = curr;
  in->count = 0;
  return true;
}

// ----- Main functions -----

void inputs_init() {
  encoder_init();
  gpio_init(&encoder_button);
  gpio_init(&mode_switch);
  for (int i = 0; i < NUM_TRACKS; i++) {
    gpio_init(&track_buttons[i]);
  }
}

void inputs_loop() {
  int steps = encoder_poll();
  if (steps != 0) {
    Event e = {.type = EVT_ENCODER, .id = 0, .value = steps};
    event_queue_push(&e);
  }

  if (gpio_poll(&encoder_button) && encoder_button.stable) {
    Event e = {.type = EVT_ENCODER, .id = 0, .value = 0}; // 0 is reserved for press
    event_queue_push(&e);
  }

  if (gpio_poll(&mode_switch)) {
    Event e = {.type = EVT_MODE_CHANGED, .id = 0, .value = mode_switch.stable};
    event_queue_push(&e);
  }

  for (int i = 0; i < NUM_TRACKS; i++) {
    if (gpio_poll(&track_buttons[i]) && track_buttons[i].stable) {
      Event e = {.type = EVT_BUTTON_PRESSED, .id = i, .value = 0};
      event_queue_push(&e);
    }
  }
}
