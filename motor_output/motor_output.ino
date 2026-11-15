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
Motor motors[NUM_OF_MOTORS];                                         // 3 motors, can scale up

// ------------------------------------------------------------------------------------------------------------------------------------------
// each entry describes one song. NoteEvent arrays stay in TestSong.cpp (THIS WILL BE REMOVED WHEN ECE2/ECE1 INPUTS + TIMELINE ARE INTEGRATED)

const Timeline playlist[] = {
  washing_introTimeline,
  washing_buildTimeline,
  washing_body1Timeline,
  washing_body2Timeline
};

const int PLAYLIST_COUNT = sizeof(playlist) / sizeof(playlist[0]);

int currentTimelineIndex = 0;
bool timelineStarted = false;
bool timelineDone = false;
bool playlistDone = false;

void stopAllMotors() {
  for (int i = 0; i < NUM_OF_MOTORS; i++) {
    stopNote(motors[i]);
  }
}

void startCurrentTimeline() {
  const Timeline &timeline = playlist[currentTimelineIndex];

  stopAllMotors();
  stopSample();

  timelineDone = false;

  // Log while motors are stopped, before starting this song's clock.
  Serial.print("Starting timeline ");
  Serial.print(currentTimelineIndex + 1);
  Serial.print("/");
  Serial.print(PLAYLIST_COUNT);
  Serial.print(": ");
  Serial.println(timeline.name);

  startSequencer(timeline);                                  // Reset both tracks and start at zero
  timelineStarted = true;
}
// ------------------------------------------------------------------------------------------------------------------------------------------

void setup() {

  Serial.begin(9600);
  Serial.println("******************************************************************");

  // initialize all motors
  for (int motorNum = 0; motorNum < NUM_OF_MOTORS; motorNum++) {
    initMotor(motors[motorNum], motorNum + 1, stpPin[motorNum], dirPin[motorNum]);
  }

  
  bool audioReady = beginSpeakerAudio(i2sBclkPin, i2sLrcPin, i2sDataPin);

  if (!audioReady) {
      Serial.println("Speaker setup failed. Motor playback can still run.");
  }

  Serial.println("Motors and percussion will play together automatically.");
  Serial.println("Press p after the playlist finishes to replay.");

}

void loop() {

    // Send 'p' after the entire playlist finishes to play both songs again.
    // Serial.read only runs when a character is already available

    if (Serial.available() > 0) {
      char command = Serial.read();

      // The next loop update starts again with the first playlist entry.
      if (command == 'p' && playlistDone) {
        currentTimelineIndex = 0;
        timelineStarted = false;
        timelineDone = false;
        playlistDone = false;
      }
    }

  // Run both event arrays against one shared clock.

  if (!playlistDone) {

    if (!timelineStarted) {
      startCurrentTimeline();
    }

    const Timeline &timeline = playlist[currentTimelineIndex];

    updateSequencer(
      timeline,
      motors,
      NUM_OF_MOTORS,
      false,                   // Play this timeline once before advancing.
      timelineDone
    );

    if (timelineDone) {
      // The sequencer has already stopped both outputs at the song boundary.
      currentTimelineIndex++;
      timelineStarted = false;

      if (currentTimelineIndex >= PLAYLIST_COUNT) {
        playlistDone = true;
        Serial.println("Playlist finished. Press p to replay.");
      }

      // Otherwise, the next loop() call starts the next song with a fresh clock.
    }
  }

  // always update motor STEP signals

  for (int i = 0; i < NUM_OF_MOTORS; i++) {
    updateMotor(motors[i]);
  }

  // Other non-blocking tasks can run here

}