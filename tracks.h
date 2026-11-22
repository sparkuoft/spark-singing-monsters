#ifndef TRACKS_H
#define TRACKS_H

#include "config.h"

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

void track_queue_init();
bool track_queue_overwrite(Track *track);
bool track_queue_peek(Track *track);

#endif  // TRACKS_H