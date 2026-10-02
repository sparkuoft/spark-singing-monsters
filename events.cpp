#include "events.h"

static QueueHandle_t event_queue;

void event_queue_init() {
  event_queue = xQueueCreate(EVENT_QUEUE_SIZE, sizeof(Event));
}

bool event_queue_push(Event *event) {
  return xQueueSend(event_queue, event, 0) == pdTRUE;
}

bool event_queue_pop(Event *event) {
  return xQueueReceive(event_queue, event, 0) == pdTRUE;
}
