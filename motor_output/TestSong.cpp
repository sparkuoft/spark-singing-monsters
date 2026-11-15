// this is a standin for inputs from ECE2: Sound processing

#include <Arduino.h>
#include "TestSong.h"
#include "Notes.h"

// NoteEvent:   {motorNum, frequency, startTime, duration, started, finished}
// SampleEvent: {sampleId, startTime, handled}
// Use false for all event-state fields in exported data.
// Sample IDs: 1 = /kick.wav, 2 = /snare_1.wav, 3 = /tom_1.wav.
// A new sample interrupts the previous sample. This player does not mix audio.

NoteEvent chords1Notes[] = {
    // Motor 1
    {1, C4, 0, 5000, false, false},
    {1, E4, 5000, 5000, false, false},
    {1, C4, 10000, 5000, false, false},
    {1, C4, 15000, 2500, false, false},
    {1, C4, 17500, 2500, false, false},

    // Motor 2
    {2, E4, 0, 5000, false, false},
    {2, G4, 5000, 5000, false, false},
    {2, E4, 10000, 5000, false, false},
    {2, F4, 15000, 2500, false, false},
    {2, F4, 17500, 2500, false, false},

    // Motor 3
    {3, G4, 0, 5000, false, false},
    {3, B4, 5000, 5000, false, false},
    {3, A4, 10000, 5000, false, false},
    {3, A4, 15000, 2500, false, false},
    {3, GS4, 17500, 2500, false, false},
};

// Demo percussion pattern; replace these hits with generator output later.
SampleEvent chords1Samples[] = {
  {1, 0, false},
  {2, 5000, false},
  {1, 10000, false},
  {2, 15000, false},
  {3, 17500, false},
};

const Timeline chords1Timeline = {
  "chords1",
  chords1Notes,
  sizeof(chords1Notes) / sizeof(chords1Notes[0]),
  chords1Samples,
  sizeof(chords1Samples) / sizeof(chords1Samples[0]),
  20000
};

// melody1

NoteEvent melody1Notes[] = {
    // Motor 1
    {1, DS4, 0, 850, false, false},
    {1, DS5, 850, 850, false, false},
    {1, D5, 1700, 1500, false, false},
    {1, AS4, 3200, 500, false, false},
    {1, C5, 3700, 500, false, false},
    {1, DS4, 4200, 850, false, false},
    {1, DS5, 5050, 850, false, false},
    {1, D5, 5900, 1500, false, false},
    {1, AS4, 7400, 500, false, false},
    {1, C5, 7900, 500, false, false},
    {1, GS4, 8400, 850, false, false},
    {1, G5, 9250, 850, false, false},
    {1, F5, 10100, 1500, false, false},
    {1, DS5, 11600, 500, false, false},
    {1, F5, 12100, 500, false, false},
    {1, DS4, 12600, 850, false, false},
    {1, DS5, 13450, 850, false, false},
    {1, D5, 14300, 1500, false, false},
    {1, AS4, 15800, 500, false, false},
    {1, C5, 16300, 500, false, false},

    // Motor 3
    {3, G4, 0, 2950, false, false},
    {3, C4, 2950, 250, false, false},
    {3, DS4, 3200, 500, false, false},
    {3, F4, 3700, 500, false, false},
    {3, G4, 4200, 2950, false, false},
    {3, C4, 7150, 250, false, false},
    {3, DS4, 7400, 500, false, false},
    {3, F4, 7900, 500, false, false},
    {3, F4, 8400, 2950, false, false},
    {3, C4, 11350, 250, false, false},
    {3, F4, 11600, 500, false, false},
    {3, GS4, 12100, 500, false, false},
    {3, G4, 12600, 2950, false, false},
    {3, C4, 15550, 250, false, false},
    {3, DS4, 15800, 500, false, false},
    {3, F4, 16300, 500, false, false},
};

// Demo percussion pattern; replace these hits with generator output later.
SampleEvent melody1Samples[] = {
  {1, 0, false},
  {2, 1700, false},
  {3, 3200, false},
  {1, 4200, false},
  {2, 5900, false},
  {3, 7400, false},
  {1, 8400, false},
  {2, 10100, false},
  {3, 11600, false},
  {1, 12600, false},
  {2, 14300, false},
  {3, 15800, false},
};

const Timeline melody1Timeline = {
  "melody1",
  melody1Notes,
  sizeof(melody1Notes) / sizeof(melody1Notes[0]),
  melody1Samples,
  sizeof(melody1Samples) / sizeof(melody1Samples[0]),
  16800
};

// arpeggio

NoteEvent arpeggioNotes[] = {
    // Motor 1
    {1, C4, 0, 400, false, false},
    {1, E4, 500, 400, false, false},
    {1, E4, 1000, 400, false, false},
    {1, G4, 1500, 400, false, false},
    {1, E4, 2000, 400, false, false},
    {1, E4, 2500, 400, false, false},
    {1, C4, 3000, 400, false, false},
    {1, E4, 3500, 400, false, false},
    {1, E4, 4000, 400, false, false},
    {1, G4, 4500, 900, false, false},
    {1, F4, 5500, 400, false, false},
    {1, D4, 6000, 400, false, false},
    {1, F4, 6500, 400, false, false},
    {1, F4, 7000, 400, false, false},
    {1, A4, 7500, 400, false, false},
    {1, F4, 8000, 400, false, false},
    {1, F4, 8500, 400, false, false},
    {1, D4, 9000, 400, false, false},
    {1, F4, 9500, 400, false, false},
    {1, F4, 10000, 400, false, false},
    {1, A4, 10500, 900, false, false},
    {1, G4, 11500, 400, false, false},

    // Motor 2
    {2, E4, 0, 4500, false, false},
    {2, C4, 4500, 1000, false, false},
    {2, F4, 5500, 5000, false, false},
    {2, D4, 10500, 900, false, false},

    // Motor 3
    {3, C5, 0, 5500, false, false},
    {3, D5, 5500, 5000, false, false},
    {3, F4, 10500, 900, false, false},
};

// Demo percussion pattern; replace these hits with generator output later.
SampleEvent arpeggioSamples[] = {
  {1, 0, false},
  {3, 1000, false},
  {2, 2000, false},
  {3, 3000, false},
  {1, 4000, false},
  {3, 5000, false},
  {2, 6000, false},
  {3, 7000, false},
  {1, 8000, false},
  {3, 9000, false},
  {2, 10000, false},
  {3, 11000, false},
};

const Timeline arpeggioTimeline = {
  "arpeggio",
  arpeggioNotes,
  sizeof(arpeggioNotes) / sizeof(arpeggioNotes[0]),
  arpeggioSamples,
  sizeof(arpeggioSamples) / sizeof(arpeggioSamples[0]),
  12000
};