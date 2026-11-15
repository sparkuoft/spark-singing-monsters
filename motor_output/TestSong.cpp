// this is a standin for inputs from ECE2: Sound processing

#include <Arduino.h>
#include "TestSong.h"
#include "Notes.h"

// NoteEvent:   {motorNum, frequency, startTime, duration, started, finished}
// SampleEvent: {sampleId, startTime, handled}
// Use false for all event-state fields in exported data.
// Sample IDs: 1 = /kick.wav, 2 = /snare_1.wav, 3 = /tom_1.wav.
// A new sample interrupts the previous sample. This player does not mix audio.

// washing_body2

NoteEvent washing_body2Notes[] = {
    // Motor 2
    {2, D4, 0, 1950, false, false},
    {2, E4, 2000, 950, false, false},
    {2, D4, 3000, 950, false, false},
    {2, F4, 4000, 950, false, false},
    {2, C4, 5000, 950, false, false},
    {2, F4, 6000, 950, false, false},
    {2, G4, 7000, 450, false, false},

    // Motor 3
    {3, A4, 0, 450, false, false},
    {3, D5, 500, 450, false, false},
    {3, C5, 1000, 200, false, false},
    {3, D5, 1250, 200, false, false},
    {3, AS4, 1500, 450, false, false},
    {3, A4, 2000, 450, false, false},
    {3, G4, 2500, 200, false, false},
    {3, A4, 2750, 200, false, false},
    {3, F4, 3000, 450, false, false},
    {3, FS4, 3500, 200, false, false},
    {3, G4, 3750, 200, false, false},
    {3, A4, 4000, 450, false, false},
    {3, F4, 4500, 450, false, false},
    {3, E4, 5000, 200, false, false},
    {3, F4, 5250, 200, false, false},
    {3, G4, 5500, 200, false, false},
    {3, A4, 5750, 200, false, false},
    {3, AS4, 6000, 450, false, false},
    {3, C5, 6500, 450, false, false},
    {3, AS4, 7000, 450, false, false},
    {3, A4, 7500, 450, false, false},
};

SampleEvent washing_body2Samples[] = {
    {1, 0, false}, // Kick
    {1, 250, false}, // Kick
    {2, 500, false}, // Snare
    {2, 750, false}, // Snare
    {1, 1000, false}, // Kick
    {1, 1250, false}, // Kick
    {2, 1500, false}, // Snare
    {2, 1750, false}, // Snare
    {1, 2000, false}, // Kick
    {1, 2250, false}, // Kick
    {2, 2500, false}, // Snare
    {2, 2750, false}, // Snare
    {1, 3000, false}, // Kick
    {1, 3250, false}, // Kick
    {2, 3500, false}, // Snare
    {2, 3750, false}, // Snare
    {1, 4000, false}, // Kick
    {1, 4250, false}, // Kick
    {1, 5000, false}, // Kick
    {1, 5250, false}, // Kick
    {1, 6000, false}, // Kick
    {1, 6250, false}, // Kick
};

const Timeline washing_body2Timeline = {
    "washing_body2",
    washing_body2Notes,
    sizeof(washing_body2Notes) / sizeof(washing_body2Notes[0]),
    washing_body2Samples,
    sizeof(washing_body2Samples) / sizeof(washing_body2Samples[0]),
    8000
};

// washing_body1

NoteEvent washing_body1Notes[] = {
    // Motor 2
    {2, D4, 0, 1950, false, false},
    {2, E4, 2000, 950, false, false},
    {2, D4, 3000, 950, false, false},
    {2, F4, 4000, 950, false, false},
    {2, C4, 5000, 950, false, false},
    {2, F4, 6000, 950, false, false},
    {2, G4, 7000, 450, false, false},

    // Motor 3
    {3, A4, 0, 450, false, false},
    {3, D5, 500, 450, false, false},
    {3, C5, 1000, 200, false, false},
    {3, D5, 1250, 200, false, false},
    {3, AS4, 1500, 450, false, false},
    {3, A4, 2000, 450, false, false},
    {3, G4, 2500, 200, false, false},
    {3, A4, 2750, 200, false, false},
    {3, F4, 3000, 450, false, false},
    {3, FS4, 3500, 200, false, false},
    {3, G4, 3750, 200, false, false},
    {3, A4, 4000, 450, false, false},
    {3, F4, 4500, 450, false, false},
    {3, E4, 5000, 200, false, false},
    {3, F4, 5250, 200, false, false},
    {3, G4, 5500, 200, false, false},
    {3, A4, 5750, 200, false, false},
    {3, AS4, 6000, 450, false, false},
    {3, C5, 6500, 450, false, false},
    {3, AS4, 7000, 450, false, false},
    {3, A4, 7500, 450, false, false},
};

const Timeline washing_body1Timeline = {
    "washing_body1",
    washing_body1Notes,
    sizeof(washing_body1Notes) / sizeof(washing_body1Notes[0]),
    nullptr,
    0,
    8000
};

// washing_intro

SampleEvent washing_introSamples[] = {
    {1, 0, false}, // Kick
    {1, 250, false}, // Kick
    {2, 500, false}, // Snare
    {2, 750, false}, // Snare
    {1, 1000, false}, // Kick
    {1, 1250, false}, // Kick
    {2, 1500, false}, // Snare
    {2, 1750, false}, // Snare
};

const Timeline washing_introTimeline = {
    "washing_intro",
    nullptr,
    0,
    washing_introSamples,
    sizeof(washing_introSamples) / sizeof(washing_introSamples[0]),
    2000
};

// washing_build

NoteEvent washing_buildNotes[] = {
    // Motor 1
    {1, A4, 0, 200, false, false},
    {1, A4, 250, 200, false, false},
    {1, A4, 500, 200, false, false},
    {1, A4, 750, 200, false, false},
    {1, A4, 1000, 200, false, false},
    {1, A4, 1250, 200, false, false},
    {1, A4, 1500, 200, false, false},
    {1, A4, 1750, 200, false, false},
    {1, A4, 2000, 200, false, false},
    {1, A4, 2250, 200, false, false},
    {1, A4, 2500, 200, false, false},
    {1, A4, 2750, 200, false, false},
    {1, A4, 3000, 200, false, false},
    {1, A4, 3250, 200, false, false},
    {1, A4, 3500, 200, false, false},
    {1, A4, 3750, 200, false, false},

    // Motor 2
    {2, D4, 3000, 200, false, false},
    {2, D4, 3250, 200, false, false},
    {2, D4, 3500, 200, false, false},
    {2, D4, 3750, 200, false, false},

    // Motor 3
    {3, A5, 2000, 200, false, false},
    {3, A5, 2250, 200, false, false},
    {3, A5, 2500, 200, false, false},
    {3, A5, 2750, 200, false, false},
    {3, A5, 3000, 200, false, false},
    {3, A5, 3250, 200, false, false},
    {3, A5, 3500, 200, false, false},
    {3, A5, 3750, 200, false, false},
};

const Timeline washing_buildTimeline = {
    "washing_build",
    washing_buildNotes,
    sizeof(washing_buildNotes) / sizeof(washing_buildNotes[0]),
    nullptr,
    0,
    4000
};

// demosong

NoteEvent demosongNotes[] = {
    // Motor 1
    {1, A4, 0, 4000, false, false},
    {1, G4, 4000, 4000, false, false},
    {1, D4, 8000, 8000, false, false},

    // Motor 2
    {2, CS5, 0, 4000, false, false},
    {2, AS4, 4000, 4000, false, false},
    {2, FS4, 8000, 4000, false, false},
    {2, F4, 12000, 4000, false, false},

    // Motor 3
    {3, E4, 0, 4000, false, false},
    {3, CS5, 4000, 4000, false, false},
    {3, A4, 8000, 8000, false, false},
};

const Timeline demosongTimeline = {
    "demosong",
    demosongNotes,
    sizeof(demosongNotes) / sizeof(demosongNotes[0]),
    nullptr,
    0,
    16000
};

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