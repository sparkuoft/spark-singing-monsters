#ifndef TRACKS_H
#define TRACKS_H

#include "config.h"

#define TRACK_QUEUE_SIZE 4  // since there are 4 instrumental tracks

void track_queue_init();
bool track_queue_push(Track *track);
bool track_queue_pop(Track *track);

#endif  // TRACKS_H