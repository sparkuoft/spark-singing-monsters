#ifndef EVENTS_H
#define EVENTS_H

#include "config.h"

#define EVENT_QUEUE_SIZE 16

typedef enum {
  EVT_NONE,
  EVT_BUTTON_PRESSED, // id = track/button index
  EVT_MODE_CHANGED, // value = Mode
  // need more, ask subteams etc.
} EventType;

typedef struct {
  EventType type;
  uint8_t id;
  int32_t value;
} Event;

void event_queue_init();
bool event_queue_push(Event *event);
bool event_queue_pop(Event *event);

#endif // EVENTS_H
