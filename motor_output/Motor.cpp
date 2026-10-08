// Motor.h and Motor.cpp control how a motor produces a freuqncy

#include <Arduino.h>
#include "Motor.h"

void initMotor(Motor &motor, int motorID, int stpPin, int dirPin) {

  // initialize playing false
  motor.playing = false;

  // motor pin declarations
  motor.stpPin = stpPin;
  motor.dirPin = dirPin;

  // play nothing upon initialization
  motor.noteFreq = 0.0;
  motor.switchPeriod = 0.0;

  // initialize timing/state
  motor.lastStepSwitchTime = micros();
  motor.stepState = LOW;

  // configure A4988 control pins
  pinMode(motor.stpPin, OUTPUT);
  pinMode(motor.dirPin, OUTPUT);

  // establish initial output states
  digitalWrite(motor.stpPin, motor.stepState);
  digitalWrite(motor.dirPin, HIGH);                 // clockwise

  // debugging
    Serial.print("Motor ");
    Serial.print(motorID);
    Serial.println(" initialized:");

    Serial.print("  STEP pin: ");
    Serial.println(motor.stpPin);

    Serial.print("  DIR pin: ");
    Serial.println(motor.dirPin);

    Serial.print("  Initial STEP state: ");
    Serial.println(motor.stepState ? "HIGH" : "LOW");

    Serial.println();

}

void updateMotor(Motor &motor) {

    unsigned long currentTime = micros();

    if (motor.playing == false) {
      return;
    }

    else if (motor.playing == true && currentTime - motor.lastStepSwitchTime >= motor.switchPeriod) {

        // toggle stored STEP state
        motor.stepState = !motor.stepState;
        digitalWrite(motor.stpPin, motor.stepState);

        // update timing reference
        motor.lastStepSwitchTime = currentTime;
    }
}

void startNote(Motor &motor, double noteFreq){
  motor.playing = true;
  motor.noteFreq = noteFreq;
  motor.switchPeriod = (1/noteFreq) * 500000;  // switches STEP state after every half-period

  motor.lastStepSwitchTime = micros();  // timer starts at 0 relative to this timestamp

  motor.stepState = LOW;
  digitalWrite(motor.stpPin, motor.stepState);
}

void stopNote(Motor &motor) {
  motor.playing = false;

  motor.stepState = LOW;
  digitalWrite(motor.stpPin, motor.stepState);

  motor.noteFreq = 0.0;
  motor.switchPeriod = 0.0;
}