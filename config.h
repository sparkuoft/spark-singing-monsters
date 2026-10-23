#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>
#include <stdint.h>

// ----- Constants -----

#define NUM_TRACKS 4
#define ENCODER_MAX_COUNT 1000
#define ENCODER_FILTER 10000 // in ns

// ----- Pin mappings -----
// Use PIN_<DEVICE>_<FUNCTION> pattern
#define PIN_SWITCH_MODE 9
#define PIN_BUTTON_TRACK_1 10
#define PIN_BUTTON_TRACK_2 11
#define PIN_BUTTON_TRACK_3 12
#define PIN_BUTTON_TRACK_4 13
#define PIN_ENCODER_A 14
#define PIN_ENCODER_B 15
#define PIN_ENCODER_BUTTON 16
// etc.

// ----- Enums ------

typedef enum {
  INSTR_DRUMS,
  INSTR_CYMBALS,
  INSTR_PIANO,
  INSTR_VIOLIN
} InstrumentType;

typedef enum {
  MODE_RECORD,
  MODE_PLAYBACK
} Mode;

typedef enum {
  TRACK_EMPTY, // Off
  TRACK_RECORDING, // Blue
  TRACK_PLAYING, // Green
  TRACK_MUTED // Red
} TrackState;

// ----- Structs -----

typedef struct {
  uint8_t id; // Needed?
  InstrumentType instrument;
  TrackState state;

  // Information about recording and cursor position?  
} Track;

#endif // CONFIG_H
