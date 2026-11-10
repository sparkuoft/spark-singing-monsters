#include "leds.h"
//#include "xxx.h"
#include <FastLED.h>

static Track tracks[NUM_TRACKS];
static CRGB leds[NUM_LEDS];

void leds_init() {
  FastLED.addLeds<WS2812B, PIN_LED_TRACK, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(LED_BRIGHTNESS);
  FastLED.clear();
  FastLED.show();
}

void leds_loop() {
  FastLED.clear();

  // TODO: Update tracks with calls to controller functions

  for (int i = 0; i < NUM_TRACKS; i++) {
    CRGB button_colour, cursor_colour;
    uint32_t pos = 0;

    if (tracks[i].trackEndTime > 0) {
      pos = (tracks[i].trackCurrentTime * (LEDS_PER_TRACK - 1) / tracks[i].trackEndTime) % (LEDS_PER_TRACK - 1);
    }

    switch (tracks[i].state) {
      case TRACK_EMPTY: button_colour = CRGB::Black; break;
      case TRACK_RECORDING: button_colour = CRGB::Blue; break;
      case TRACK_PLAYING: button_colour = CRGB::Green; break;
      case TRACK_MUTED: button_colour = CRGB::Red; break;
      default: button_colour = CRGB::Magenta; // error state
    }

    switch (tracks[i].state) {
      case TRACK_RECORDING: cursor_colour = CRGB::Red; break;
      case TRACK_PLAYING: cursor_colour = CRGB::White; break;
      default: cursor_colour = CRGB::Black; 
    }

    leds[i * LEDS_PER_TRACK] = button_colour;
    leds[i * LEDS_PER_TRACK + (pos + 1)] = cursor_colour; // Offset by 1 to skip button LED
  }

  FastLED.show();
}
