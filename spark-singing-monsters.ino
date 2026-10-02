#include <Arduino.h>
#include "events.h"
#include "tasks.h"

void setup() {
  Serial.begin(115200);
  event_queue_init();
  tasks_init();
  Serial.println("setup done");
}

void loop() {
  vTaskDelete(NULL); // Delete default task
}

// TODO:
// Events to wrap freertos q and streambuffer
// Channel or smth similar for abstracting audio passing between tassks
// Buttons as sample task, should be similar formatting
// Considering how non time blocking tasks will handle
// I2S not shared, but config?
// List all hardware functions (need to ask other subteams)
