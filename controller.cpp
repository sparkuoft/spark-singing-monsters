#include "controller.h"
#include "tracks.h"
#include "events.h"

// ----- Controller owned state -----

static Track tracks[NUM_TRACKS];
static Mode current_mode;
static uint32_t last_tick_ms;  // Used for sleeping

// ----- Controlller functions -----

void volume_encoder(Mode mode, Event current_event, Track tracks[]) {
  Serial.printf("Event (in encoder rec func) 0: type %d, id %u, value %d\n",
                current_event.type, current_event.id, current_event.value);
  // print encoder soemthing (number)
}

Mode mode_recording(Mode mode, Event current_event, Track tracks[]) {
  int TrackID = current_event.id;
  if (current_event.type == EVT_BUTTON_PRESSED) {  // check id of value
    // check instrument type: change state of that instrument to recording
    if (current_event.id == 0) {
      Serial.printf("Event (in mode rec func) 0: type %d, id %u, value %d\n",
                    current_event.type, current_event.id, current_event.value);
    }
    if (current_event.id == 1) {
      Serial.printf("Event (in mode rec func) 1: type %d, id %u, value %d\n",
                    current_event.type, current_event.id, current_event.value);
    }
    if (current_event.id == 2) {
      Serial.printf("Event (in mode rec func) 2: type %d, id %u, value %d\n",
                    current_event.type, current_event.id, current_event.value);
    }
    // first check if track is currently recording:
    // if button just pressed to start recording:
    // first check if any other tracks are recording, if anything else is
    // recording: OLED Statement 6: Serial.printf("You cannot record 2 tracks at
    // once, finish the first track before you record another\n");

    // check here if the button is for percussion:
    // if percussion -> check first if its a drum or cymbal
    // OLED Statement 3
    // Serial.printf("Press \"make sound\" button to lock in a *drum/cymbal*
    // hit");

    // if not percussion -> check first if its a piano or violin
    // OLED Statement 4
    // Serial.printf("Start singing immediately into the mic: will be translated
    // to *piano/violin*\n");

    // if button just pressed to stop recording:
    // first check which instrument:
    // OLED Statement 5
    // Serial.printf("*drum/cymbal/piano/violin track recorded. Press 1 of 4
    // buttons to select instrument or flip to playback mode to "make" an
    // instrument\n");

    tracks[TrackID].state = TRACK_RECORDING;
    track_queue_overwrite(tracks);
    mode = MODE_RECORD;  // when event is changed, update tracks array
    Serial.printf("Mode (in mode rec func): Recording\n");
  }

  else if (current_event.type == EVT_MODE_CHANGED) {
    tracks[TrackID].state = TRACK_PLAYING;
    track_queue_overwrite(tracks);
    mode = MODE_PLAYBACK;
    Serial.printf("Mode (in func): Switching to Playing due to Button Press\n");

    // OLED Statement 7
    // Serial.printf("Playback mode ON. Press 1 of 4 buttons to mute/unmute an
    // instrument or flip to record mode on instrument\n");

  } else if (current_event.type == EVT_MIC_TIMEOUT) {
    tracks[TrackID].state = TRACK_PLAYING;
    track_queue_overwrite(tracks);
    mode = MODE_PLAYBACK;
    Serial.printf("Mode (in func): Switching to Playing due to MIC TIMEOUT\n");
  }
  // OLED Statement 10
  // Serial.printf("Mic timeout duration reached. Recording stopped.");

  return mode;
}

Mode mode_playing(Mode mode, Event current_event, Track tracks[]) {
  int TrackID = current_event.id;
  if (current_event.type == EVT_BUTTON_PRESSED) {
    tracks[TrackID].state = TRACK_PLAYING;
    track_queue_overwrite(tracks);
    mode = MODE_PLAYBACK;
    Serial.printf("Mode (in func): Playing\n");
    // check instrument and check if track is playing and is now being switched
    // to mute mode: OLED Statement 8 Serial.printf("*drums/cymbal/violin/piano*
    // muted. Press 1 of 4 buttons to mute/unmute an instrument, or flip to
    // record mode to record an instrument\n");

    // if currently muted and button pressed to unmute:
    // check instrument
    // OLED Statement 9
    // Serial.printf("*drums/piano/cymbal/violin* unmuted. Press 1 of 4 buttons
    // to mute/unmute an instrument, or flip to record mode to record an
    // instrument\n");
  }

  else if (current_event.type == EVT_MODE_CHANGED) {
    tracks[TrackID].state = TRACK_RECORDING;
    track_queue_overwrite(tracks);
    mode = MODE_RECORD;
    Serial.printf("Mode (in func): Switching to Recording\n");

    // when mode initially flipped to recording to start
    // OLED Statement 2
    // Serial.printf("Record mode ON Press 1 of 4 buttons to select instrument,
    // or flip to playback mode to "mute" an instrument\n");
  }

  return mode;
}

Mode mode_sd_occupied(Mode mode, Event current_event, Track tracks[]) {
  Serial.printf("Mode: SD Occupied\n");
  if (current_event.type == EVT_SD_READ) {
    // pass Track Array
  }
  if (current_event.type == EVT_SD_DONE) {
    // will just return when done
  }
  return mode;
}

void controller_debug() {
  Event e;
  while (event_queue_pop(&e)) {
    Serial.printf("Event: type %d, id %u, value %d\n", e.type, e.id, e.value);
    // begin

    // check here for game timeout... it should be the first check w/ id 70
    //  if timeout or reset button and the current mode is not already recording
    //  OLED Statement 1
    //  Serial.printf("Flip to record mode to begin recording your song\n");

    if (e.type == EVT_ENCODER) {
      volume_encoder(current_mode, e, tracks);
      Serial.printf("Volume_Encoder\n");
    } else if (current_mode == MODE_RECORD) {
      current_mode = mode_recording(current_mode, e, tracks);
      Serial.printf("Mode: Recording\n");
    }

    else if (current_mode == MODE_PLAYBACK) {
      current_mode = mode_playing(current_mode, e, tracks);
    }

    if (current_mode == MODE_SD_OCCUPIED) {
      current_mode = mode_sd_occupied(current_mode, e, tracks);
    }
    // end
  }
}

void controller_init() {
  // Various init calls from drivers, other subteams

  for (int i = 0; i < NUM_TRACKS; i++) {
    tracks[i].id = i;
    tracks[i].instrument = (InstrumentType)i;
    tracks[i].state = TRACK_EMPTY;
    // Clear leds
  }

  // Call driver to set current_mode

  last_tick_ms = millis();
}

void controller_loop() {
  // DEBUG:
  controller_debug();

  // Poll inputs manager

  // Dequeue events and handle them

  // Update timeouts
}
