#ifndef EVENTS_H
#define EVENTS_H

#include "config.h"

#define EVENT_QUEUE_SIZE 16

typedef enum {

} EventType;

typedef struct {
  
} Event;

// ----- Event queue ------

void event_queue_init();
bool event_queue_push(Event *event);
bool event_queue_pop(Event *event);
bool event_queue_is_empty();

// ----- Input events -----

void event_manager_init(); // idk???

#endif // EVENTS_H
