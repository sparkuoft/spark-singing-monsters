// Sequencer.h and Sequencer.cpp control what should be playing and when
// this is a standin for inputs from ECE2: Sound processing

#include <Arduino.h>
#include "Sequencer.h"
#include "SpeakerAudio.h"

unsigned long timelineStartTimeMs = 0;

void startSequencer(const Timeline &timeline) {
    for (int i = 0; i < timeline.numNotes; i++) {
        timeline.notes[i].started = false;
        timeline.notes[i].finished = false;
    }
    
    for (int i = 0; i < timeline.numSamples; i++) {
        timeline.samples[i].handled = false;
    }

    timelineStartTimeMs = millis();
}

void updateSequencer(const Timeline &timeline, Motor motors[], int numMotors, bool loop, bool &done) {

    if (done) {
        return;
    }
    
    unsigned long timelineElapsedMs = millis() - timelineStartTimeMs;

    // End the full timeline before considering any new events.
    // This also cuts off notes/samples that would extend past the song boundary.
    if (timelineElapsedMs >= timeline.duration) {
        for (int i = 0; i < numMotors; i++) {
        stopNote(motors[i]);
        }
        stopSample();

        if (loop) {
        startSequencer(timeline);
        } else {
        done = true;
        }
        return;
    }

    // pass 1: stop motor notes before starting any notes at the same timestamp
    for (int i = 0; i < timeline.numNotes; i++) {
        NoteEvent &note = timeline.notes[i];
        if (note.motorNum < 1 || note.motorNum > numMotors) {
        continue;
        }

        if (note.started && !note.finished &&
            timelineElapsedMs >= note.startTime &&
            timelineElapsedMs - note.startTime >= note.noteDuration) {
        stopNote(motors[note.motorNum - 1]);
        note.finished = true;
        }
    }

     // Pass 2: start notes whose time window is currently active.
    for (int i = 0; i < timeline.numNotes; i++) {
        NoteEvent &note = timeline.notes[i];
        if (note.motorNum < 1 || note.motorNum > numMotors || note.noteFreq <= 0) {
            continue;
        }

        if (!note.started && !note.finished &&
            timelineElapsedMs >= note.startTime &&
            timelineElapsedMs - note.startTime < note.noteDuration) {
        startNote(motors[note.motorNum - 1], note.noteFreq);
        note.started = true;
        }
    }

    // The speaker has ONE active sample. If several hits became due together,
    // request only the most recent one instead of sending a burst of old hits.
    // Equal timestamps: the later array entry wins. No audio mixing is performed.
    int newestDueSample = -1;

    for (int i = 0; i < timeline.numSamples; i++) {
        SampleEvent &sample = timeline.samples[i];

        if (!sample.handled && timelineElapsedMs >= sample.startTime) {
            sample.handled = true;

            if (sample.sampleID < 1 || sample.sampleID > 3) {
                continue;
            }

            if (newestDueSample == -1 ||
                sample.startTime >= timeline.samples[newestDueSample].startTime) {
                newestDueSample = i;
            }
        }
    }

    if (newestDueSample != -1) {
        // This queues a request; the existing background task streams the WAV.
        // A failed request is consumed, so missing audio does not stall the motors.
        playSample(timeline.samples[newestDueSample].sampleID);
    }
}