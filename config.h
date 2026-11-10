#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>
#include <stdint.h>

// ----- Constants -----

#define NUM_TRACKS 4
#define ENCODER_MAX_COUNT 1000
#define ENCODER_FILTER 10000 // in ns
#define DEBOUNCE_COUNT 5 
#define LED_BRIGHTNESS 64
#define LEDS_PER_TRACK 11 // 1 button led + 10 cursor leds
#define NUM_LEDS 44 // 4 tracks * LEDS_PER_TRACK
#define SAMPLES_PER_TRACK 10'000'000 // TODO: figure out what value should be
#define TIMEOUT_DURATION 3000000000  // in ns = 30 s

// ----- Pin mappings -----
// Use PIN_<DEVICE>_<FUNCTION> pattern
#define PIN_SWITCH_MODE 9
#define PIN_BUTTON_TRACK_1 10
#define PIN_BUTTON_TRACK_2 11
#define PIN_BUTTON_TRACK_3 12
#define PIN_BUTTON_TRACK_4 13
#define PIN_ENCODER_A 8
#define PIN_ENCODER_B 18
#define PIN_ENCODER_BUTTON 17
#define PIN_BUTTON_PERCUSSION 14
// etc.

// ----- Enums ------

typedef enum {
  INSTR_DRUMS,
  INSTR_CYMBALS,
  INSTR_PIANO,
  INSTR_VIOLIN
} InstrumentType;

typedef enum { MODE_RECORD, MODE_PLAYBACK, MODE_SD_OCCUPIED } Mode;

typedef enum {
  TRACK_EMPTY,      // Off
  TRACK_RECORDING,  // Blue
  TRACK_PLAYING,    // Green
  TRACK_MUTED       // Red
} TrackState;

// ----- Structs -----

typedef struct {
  uint8_t id;  // Needed?
  InstrumentType instrument;
  TrackState state;
  uint8_t volume;
  uint8_t trackCurrentTime;
  uint8_t trackEndTime;
  // Information about recording and cursor position?
} Track;

#endif  // CONFIG_H
