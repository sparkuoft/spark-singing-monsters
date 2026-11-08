#include "Motor.h"
#include "Sequencer.h"
#include "TestSong.h"
#include "Notes.h"

// pin I2S assignment & motor setup
const int stpPin[10] = {17, 13, 4, 6, 8, 10, 15};                          // all step pins here
const int dirPin[10] = {18, 12, 5, 7, 9, 11, 16};                          // all dir pins, dirPins[0] --> dirPin for motor 1, etc.

const int i2sBclkPin = 40;
const int i2sLrcPin  = 41;
const int i2sDataPin = 42;

const int stepsPerRevolution = 200;                      // 200 steps for 360 degrees, 1 step = 1.8 deg

// motor output defines:
#define NUM_OF_MOTORS 3
Motor motors[3];                                         // 3 motors, can scale up
bool songStarted = false;

void setup() {

  Serial.begin(9600);
  Serial.println("********************************");

  // initialize all motors
  for (int motorNum = 0; motorNum < NUM_OF_MOTORS; motorNum++) {
    initMotor(motors[motorNum], motorNum + 1, stpPin[motorNum], dirPin[motorNum]);
  }

  // // set beginning of song as t = 0;
  // startSequencer(); 

}

void loop() {

    // sends 'p' after the song finishes the play it again
    // Serial.read only runs when a character is already available

    if (Serial.available() > 0) {
      char command = Serial.read();

      if (command == 'p' && chords1Done) {
        songStarted = false;
        chords1Done = false;
      }
    }

    // Start sequencer - run once for each playback

    if (!songStarted && !chords1Done) {
      
      for (int i = 0; i < chords1Length; i++) {
        chords1[i].started = false;
        chords1[i].finished = false;
      }

      startSequencer();
      songStarted = true;
    }

    // PLAY:
    if (songStarted && !chords1Done) {
      updateSequencer (chords1, chords1Length, motors, chords1Duration, chords1Loop, chords1Done);
    }

    // always updated the motor step signals:

    for (int i = 0; i < NUM_OF_MOTORS; i++) {
      updateMotor(motors[i]);
    }

    // other non-blocking tasks can run here
}