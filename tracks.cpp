#include "tracks.h"

static QueueHandle_t track_queue;  // set equal to null?

void track_queue_init() {
  track_queue = xQueueCreate(TRACK_QUEUE_SIZE, sizeof(Track));
  if (track_queue == NULL) {
  }
  // NEED NULL ERROR CHECKING
}

bool track_queue_overwrite(Track *track) {
  if (track_queue == NULL) {
    return false;
  }

  return xQueueOverwrite(track_queue, track) == pdTRUE;
}

bool track_queue_peek(Track *track) {
  if (track_queue == NULL) {
    return false;
  }

  return xQueuePeek(track_queue, track) == pdTRUE;
}