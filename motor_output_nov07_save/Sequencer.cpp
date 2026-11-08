// Sequencer.h and Sequencer.cpp control what should be playing and when
// this is a standin for inputs from ECE2: Sound processing

#include <Arduino.h>
#include "Sequencer.h"

unsigned long songStartTime = 0;

void startSequencer() {
    songStartTime = millis();
}

void updateSequencer(NoteEvent events[], int numEvents, Motor motors[], unsigned long songDuration, bool loop) {

    unsigned long songTime = millis() - songStartTime;

    // pass 1: stop events
    for (int i = 0; i < numEvents; i++) {

        // if note duration amount of time has elapsed and event HAS started and event hasn't stopped
        if (songTime >= events[i].startTime + events[i].noteDuration
            && events[i].started
            && !events[i].finished) {

            stopNote(motors[events[i].motorNum - 1]);
            events[i].finished = true;
        }

    }

    // pass 2: start events
    for (int i = 0; i < numEvents; i++) {

        // if sufficient time has elapsed + event hasn't started + note's end time hasn't already passed
        if (songTime >= events[i].startTime
            && songTime < events[i].startTime + events[i].noteDuration
            && !events[i].started
            && !events[i].finished) {

            startNote(motors[events[i].motorNum - 1], events[i].noteFreq);
            events[i].started = true;
        }

    }

    // end of song, 
    // if song is suposed to loop, 
        // change all started and finished events to false, 
        // restart songStartTime

    if (songTime >= songDuration) {

        if (loop) {

            // Reset all NoteEvents so they can play again.
            for (int i = 0; i < numEvents; i++) {
                events[i].started = false;
                events[i].finished = false;
            }

            // Begin the next loop from time 0.
            songStartTime = millis();
        }
    }
}