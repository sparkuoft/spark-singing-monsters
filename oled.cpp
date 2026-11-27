#include "oled.h"
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

static Adafruit_SSD1306 display(128, 64, &Wire, -1);

void oled_init() {
  Wire.begin(PIN_OLED_SDA, PIN_OLED_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3D)) { // 0x3D for 128x64, 0x3C for 128x32
    Serial.println("OLED init failed");
    return;
  }
  display.setTextSize(1); // 1 = ~21 chars/line, 2 = ~10 chars/line
  display.setTextColor(SSD1306_WHITE);
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Press a track button to start recording");
  display.display();             
}

void oled_loop() {
  // Redraw only when the message changes. Redrawing every loop is slow over I2C.
}
