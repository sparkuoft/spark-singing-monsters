#ifndef SPEAKER_AUDIO_H

#define SPEAKER_AUDIO_H

#include <Arduino.h>

// initialize speaker hardware 
bool beginSpeakerAudio(int bclkPin, int lrcPin, int dataPin);

// accepts an instrument ID from 1 to 3. playSample(2) requests second instrument
bool playSample(uint8_t sampleID);

// interrupts whichever sample is currently playing
bool stopSample();

#endif