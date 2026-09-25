#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>
#include <stdint.h>

// ----- Constants -----

#define NUM_TRACKS 4

// ----- Pin mappings -----

#define PIN_MODE_SWITCH 9
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
