#ifndef CONTROLLER_H
#define CONTROLLER_H

#include "config.h"

// ----- Arduino ------

void controller_init();
void controller_loop();
/*
// ----- Global FSM ------

void controller_handle_mode_changed(Mode new_mode);
Mode controller_get_mode();

// ----- Per-track FSM -----

void controller_handle_track_button(Track *track);
void controller_handle_recording_timeout(Track *track);
void controller_set_track_state(Track *track, TrackState new_state);
*/
#endif // CONTROLLER_H
