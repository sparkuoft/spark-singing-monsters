#include "leds.h"
#include <FastLED.h>

// Assume we magically get the track state from controller for now

static CRGB leds[];

static volatile TrackState track_states[NUM_TRACKS]; // TODO
static volatile uint8_t track_progress[NUM_TRACKS]; // TODO

void leds_init() {
  FastLED.addLeds<WS2812, PIN_LED_TRACK, GRB>(leds, 1/*TODO*/);
  FastLED.setBrightness(LED_BRIGHTNESS);

  // Set all to off? or do it elsewhere

  FastLED.clear();
  FastLED.show();
}

void leds_loop() {
  // Read new track states and progress from mailbox?

}
