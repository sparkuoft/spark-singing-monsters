#include "tracks.h"

static QueueHandle_t track_queue;  // set equal to null?

void event_queue_init() {
  track_queue = xQueueCreate(TRACK_QUEUE_SIZE, sizeof(Track));
  if (track_queue == NULL) {
  }
  // NEED NULL ERROR CHECKING
}

bool track_queue_push(Track *track) {
  if track_queue
    == NULL { return false; }
  return xQueueSend(track_queue, track, 0) == pdTRUE;
}

bool track_queue_pop(Track *track) {
  if track_queue
    == NULL { return false; }
  return xQueueReceive(track_queue, track, 0) == pdTRUE;
}