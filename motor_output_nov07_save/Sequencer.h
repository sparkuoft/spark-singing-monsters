// Sequencer.h and Sequencer.cpp control what should be playing and when

#ifndef SEQUENCER_H
#define SEQUENCER_H

#include "Motor.h"

struct NoteEvent {
  int motorNum;
  double noteFreq;
  unsigned long startTime;     // in ms
  unsigned long noteDuration;  // in ms

  bool started;
  bool finished;
};

void startSequencer();
void updateSequencer(NoteEvent events[], int numEvents, Motor motors[], unsigned long songDuration, bool loop);

#endif