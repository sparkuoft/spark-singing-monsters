#include "Motor.h"
#include "Sequencer.h"
#include "TestSong.h"
#include "Notes.h"

// pin assignment & motor setup
const int stpPin[10] = {19, 32, 27};                          // all step pins here
const int dirPin[10] = {18, 33, 26};                          // all dir pins, dirPins[0] --> dirPin for motor 1, etc.

const int stepsPerRevolution = 200;                      // 200 steps for 360 degrees, 1 step = 1.8 deg

#define NUM_OF_MOTORS 3
Motor motors[3];                                         // 3 motors, can scale up

void setup() {

  Serial.begin(9600);
  Serial.println("********************************");

  // initialize all motors
  for (int motorNum = 0; motorNum < NUM_OF_MOTORS; motorNum++) {
    initMotor(motors[motorNum], motorNum + 1, stpPin[motorNum], dirPin[motorNum]);
  }

  // set beginning of song as t = 0;
  startSequencer(); 

}

void loop() {

    updateSequencer(melody1, melody1Length, motors, melody1Duration, melody1Loop);
    // updateSequencer(chords1, chords1Length, motors, chords1Duration, chords1Loop);


    // maintain STEP signals for all 3 motors
    for (int i = 0; i < NUM_OF_MOTORS; i++) {
        updateMotor(motors[i]);
    }

}

// void playNote (int motor, double fNote, double noteDuration){
//   // (

//     int StpPin = 0;

//     if (motor == 1){
//       StpPin = StpPinM1;
//     } else if (motor == 2){
//       StpPin = StpPinM2;
//     } else if (motor == 3){
//       StpPin = StpPinM3;
//     } else {
//       return;
//     }

//   // )

//   // change parameter to note, convert from note name to frequency;

//   double Tstep = (1/fNote) * 1000000;                      // convert frequency (Hz) to period (microseconds)
//   int numCycles = round(fNote * noteDuration);             // numCycles (cycles) = freq (cycles/s) * time (s)

//     Serial.print("fnote = ");
//     Serial.print(fNote);
//     Serial.println("!!!!!!!!!!!");

//   for (int cycle = 0; cycle < numCycles; cycle++){

//     digitalWrite(StpPin, HIGH);
//     delayMicroseconds(Tstep / 2);             // T (Period) = 1 / freq
//     digitalWrite(StpPin, LOW);
//     delayMicroseconds(Tstep / 2);
//     // delayMicroseconds(72.7272);
//   }
// }

// // FUN FUNCTIONS:

// void playMaryHad(){
//   playNote(1, 659.26, 0.4); // E

//   delay(200);

//   playNote(2, 587.33, 0.4); // D

//   delay(200);

//   playNote(3, 523.25, 0.4); // C

//   delay(200);

//   playNote(1, 587.33, 0.4); // D

//   delay(200);

//   playNote(2, 659.26, 0.4); // E

//   delay(200);

//   playNote(3, 659.26, 0.4); // E

//   delay(200);

//   playNote(1, 659.26, 0.8); // E

//   delay(200);

//   playNote(2, 587.33, 0.4); // D

//   delay(200);

//   playNote(3, 587.33, 0.4); // D

//   delay(200);

//   playNote(1, 587.33, 0.8); // D

//   delay(200);

//   playNote(2, 659.26, 0.4); // E

//   delay(200);

//   playNote(3, 783.99, 0.4); // G

//   delay(200);

//   playNote(1, 783.99, 0.8); // G

//   delay(200);

//   // PHRASE 1 END

//   playNote(2, 659.26, 0.4); // E

//   delay(200);

//   playNote(3, 587.33, 0.4); // D

//   delay(200);

//   playNote(1, 523.25, 0.4); // C

//   delay(200);

//   playNote(2, 587.33, 0.4); // D

//   delay(200);

//   playNote(3, 659.26, 0.4); // E

//   delay(200);

//   playNote(1, 659.26, 0.4); // E

//   delay(200);

//   playNote(2, 659.26, 0.4); // E

//   delay(200);

//   playNote(3, 659.26, 0.4); // E

//   delay(200);

//   // PHRASE 2 END

//   playNote(1, 587.33, 0.4); // D

//   delay(200);

//   playNote(2, 587.33, 0.4); // D

//   delay(200);

//   playNote(3, 659.26, 0.4); // E

//   delay(200);

//   playNote(1, 587.33, 0.4); // D

//   delay(200);

//   playNote(2, 523.25, 0.8); // C

//   delay(500);

//   // PHRASE 3 END
// }

// void initMotor()
