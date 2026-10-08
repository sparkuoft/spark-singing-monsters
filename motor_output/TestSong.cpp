// this is a standin for inputs from ECE2: Sound processing

#include <Arduino.h>
#include "TestSong.h"
#include "Notes.h"

// NoteEvent prototype
// ------------------
//
// NoteEvent testSong#[] = {
//      {motorNum, Frequency, startTime, noteDuration, started?, finished?}, // set false, false as default
//      ...
// };
// 
// const int testSong#Length = sizeof(testSong#) / sizeof(testSong#[0]); // how many note events are in one testStong
// const unsigned long testSong#Duration = duration; // how long the song is
// const bool testSong#Loop = t/f; // whether the song is supposed to loop or not

// test songs:

    // // melody1

    //     NoteEvent melody1[] = {
    //         // Motor 1
    //         {1, C5, 0, 400, false, false},
    //         {1, E5, 500, 400, false, false},
    //         {1, E5, 1000, 400, false, false},
    //         {1, G5, 1500, 400, false, false},
    //         {1, E5, 2000, 400, false, false},
    //         {1, E5, 2500, 400, false, false},
    //         {1, C5, 3000, 400, false, false},
    //         {1, E5, 3500, 400, false, false},
    //         {1, E5, 4000, 400, false, false},
    //         {1, G5, 4500, 900, false, false},
    //         {1, F5, 5500, 400, false, false},

    //         {1, D5, 6000, 400, false, false},
    //         {1, F5, 6500, 400, false, false},
    //         {1, F5, 7000, 400, false, false},
    //         {1, A5, 7500, 400, false, false},
    //         {1, F5, 8000, 400, false, false},
    //         {1, F5, 8500, 400, false, false},
    //         {1, D5, 9000, 400, false, false},
    //         {1, F5, 9500, 400, false, false},
    //         {1, F5, 10000, 400, false, false},
    //         {1, A5, 10500, 900, false, false},
    //         {1, G5, 11500, 400, false, false},

    //         // Motor 2
    //         {2, G4, 0, 4500, false, false},
    //         {2, A4, 6000, 11500-6000, false, false},

    //         // Motor 3
    //         {3, C4, 3000, 400, false, false},
    //         {3, E4, 3500, 400, false, false},
    //         {3, E4, 4000, 400, false, false},
    //         {3, G4, 4500, 900, false, false},
    //         {3, F4, 5500, 400, false, false},

    //         {3, D4, 9000, 400, false, false},
    //         {3, F4, 9500, 400, false, false},
    //         {3, F4, 10000, 400, false, false},
    //         {3, A4, 10500, 900, false, false},
    //         {3, G4, 11500, 400, false, false},
    //     };

    //     const int melody1Length = sizeof(melody1) / sizeof(melody1[0]);

    // chords1

        NoteEvent chords1[] = {
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

        const int chords1Length =
            sizeof(chords1) / sizeof(chords1[0]);

        const unsigned long chords1Duration = 20000;

        const bool chords1Loop = true;

    // melody1

        NoteEvent melody1[] = {
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

        const int melody1Length =
            sizeof(melody1) / sizeof(melody1[0]);

        const unsigned long melody1Duration = 16800;

        const bool melody1Loop = true;

