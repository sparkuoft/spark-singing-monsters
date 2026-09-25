#include "events.h"

// ----- Event queue state -----

static Event queue_buf[EVENT_QUEUE_SIZE];
static uint8_t queue_head;
static uint8_t queue_tail;
static uint8_t queue_count;

// ----- Functions -----
