#include <Arduino.h>
#include "tasks.h"

void setup() {
  Serial.begin(115200);
  // Need to create tasks and inter-task communication
  // xQueueCreate() for events
  // xStreamBufferCreate() for audio??? aynaz/joshua
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
