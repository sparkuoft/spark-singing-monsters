#include "tracks.h"

static QueueHandle_t track_queue;  // set equal to null?

void track_queue_init() {
  track_queue = xQueueCreate(1, sizeof(Track) * NUM_TRACKS);
  if (track_queue == NULL) {
  }
  // NEED NULL ERROR CHECKING
}

bool track_queue_overwrite(Track *tracks) {
  if (track_queue == NULL) {
    return false;
  }

  return xQueueOverwrite(track_queue, tracks) == pdTRUE;
}

bool track_queue_peek(Track *tracks) {
  if (track_queue == NULL) {
    return false;
  }

  return xQueuePeek(track_queue, tracks, 0) == pdTRUE;
}