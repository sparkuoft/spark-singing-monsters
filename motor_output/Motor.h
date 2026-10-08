// Motor.h and Motor.cpp control how a motor produces a freuqncy

#ifndef MOTOR_H
#define MOTOR_H

struct Motor {
  int stpPin;                                            // step pin #
  int dirPin;                                            // HIGH: Spins CW, LOW: Spins CCW
  
  double noteFreq;                                       // in Hz
  double switchPeriod;                                   // = (1.00 / noteFreq) * 500000 --> (periodT / 2, when HIGH->LOW or LOW->HIGH) in us (microseconds)
  
  unsigned long lastStepSwitchTime;                      // micros() returns unsigned long
  bool stepState;                                        // did step previously switch to HIGH or LOW

  bool playing;
};

void initMotor(Motor &motor, int motorID, int stpPin, int dirPin);
void updateMotor(Motor &motor);
void startNote(Motor &motor, double noteFreq);
void stopNote(Motor &motor);

#endif