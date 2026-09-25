#include <Arduino.h>
#include "controller.h"

void setup() {
  Serial.begin(115200);
  controller_init();
  Serial.println("setup done");
}

void loop() {
  controller_loop();
}
