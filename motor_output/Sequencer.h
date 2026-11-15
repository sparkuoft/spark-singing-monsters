// Sequencer.h and Sequencer.cpp control what should be playing and when

#ifndef SEQUENCER_H
#define SEQUENCER_H

#include <Arduino.h>
#include "Motor.h"

struct NoteEvent {
  int motorNum;
  double noteFreq;
  unsigned long startTime;     // in ms
  unsigned long noteDuration;  // in ms

  bool started;
  bool finished;
};

struct SampleEvent {
  uint8_t sampleID;            // 1: kick, 2: snare, 3: tom
  unsigned long startTime;     // ms from the beginning of THIS song
  bool handled;                // false intially: prevents handling a scheduled hit twice
};

// NOTE EVENTS + SAMPLE EVENTS COMBINED
struct Timeline {
  const char * name;
  
  NoteEvent * notes;
  int numNotes;

  SampleEvent * samples;
  int numSamples;

  unsigned long duration;      // full timeline, including any space after events 
};

void startSequencer(const Timeline &timeline);
void updateSequencer(const Timeline &timeline, Motor motors[], int numMotors, bool loop, bool &done);

#endif