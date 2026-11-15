#include "Motor.h"
#include "Sequencer.h"
#include "TestSong.h"
#include "SpeakerAudio.h"
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
const bool TEST_SAMPLES_ONLY = true;

void setup() {

  Serial.begin(9600);
  Serial.println("********************************");

  // initialize all motors
  for (int motorNum = 0; motorNum < NUM_OF_MOTORS; motorNum++) {
    initMotor(motors[motorNum], motorNum + 1, stpPin[motorNum], dirPin[motorNum]);
  }

  
  bool audioReady = beginSpeakerAudio(i2sBclkPin, i2sLrcPin, i2sDataPin);

  if (!audioReady) {
      Serial.println("Speaker setup failed.");
  }
}

void loop() {

    // sends 'p' after the song finishes the play it again
    // Serial.read only runs when a character is already available

    if (Serial.available() > 0) {
      char command = Serial.read();

      // Play one of the three percussion samples
      if (command >= '1' && command <= '3') {
        if (!playSample(command - '0')) {
          Serial.println("Sample request failed.");
        }
      }

      // Stop the currently playing sample
      else if (command == '0') {
        stopSample();
      }

      // Restart the motor song once it finishes
      else if (command == 'p' && arppegioDone) {
        songStarted = false;
        arppegioDone = false;
      }
    }

  // run the motor sequencer (optional during testing)

  if (!TEST_SAMPLES_ONLY) {

    // Start sequencer once for each playback session
    if (!songStarted && !arppegioDone) {

      for (int i = 0; i < arppegioLength; i++) {
        arppegio[i].started = false;
        arppegio[i].finished = false;
      }

      startSequencer();
      songStarted = true;
    }

    // Update the song's note events
    if (songStarted && !arppegioDone) {
      updateSequencer(
        arppegio,
        arppegioLength,
        motors,
        arppegioDuration,
        arppegioLoop,
        arppegioDone
      );
    }
  }

  // always update motor STEP signals

  for (int i = 0; i < NUM_OF_MOTORS; i++) {
    updateMotor(motors[i]);
  }

  // Other non-blocking tasks can run here
}