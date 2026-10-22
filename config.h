#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>
#include <stdint.h>

// ----- Constants -----

#define NUM_TRACKS 4

// ----- Pin mappings -----
// Use PIN_<FUNCTION>_<TYPE> pattern
#define PIN_MODE_SWITCH 9
#define PIN_TRACK_1_BUTTON 10
#define PIN_TRACK_2_BUTTON 11
#define PIN_TRACK_3_BUTTON 12
#define PIN_TRACK_4_BUTTON 13
#define PIN_VOLUME_A 14
#define PIN_VOLUME_B 15
#define PIN_VOLUME_BUTTON 16
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
