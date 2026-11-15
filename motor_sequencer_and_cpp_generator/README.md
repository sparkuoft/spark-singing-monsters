# SPARK ECE3 Sequencer — Copy/Paste TestSong Output

This version builds on the percussion-overlap validation release. All existing playback, WAV paths, JSON Save/Load, motor editing, and overlap protection remain.

## What's new

- `Generate C++ Timeline` produces **two separate paste-ready sections**.
- **TestSong.h:** `extern const Timeline nameTimeline;` only. Place this next to existing timeline declarations, before `#endif`.
- **TestSong.cpp:** `NoteEvent nameNotes[]`, `SampleEvent nameSamples[]`, and `const Timeline nameTimeline` with `sizeof(array) / sizeof(array[0])` counts, matching the hand-written examples.
- Each has its own Copy button. No duplicate headers, `#include` statements, or unnecessary `const bool nameLoop` declaration is emitted.
- If there are no motor notes or no percussion hits, the empty track is represented by `nullptr` and `0` in `Timeline`; no empty C++ arrays are declared.
- The **Loop Timeline** setting is saved in the browser's JSON, but firmware looping is still controlled by your `.ino` (the `loop` argument to `updateSequencer`).
- When regenerating an existing name, replace old declarations/definitions—do not append duplicates.

## Install

Replace `index.html`, `script.js`, and `style.css` in `motor_sequencer_and_cpp_generator/` with the corresponding files from this package. Keep existing `motor_output/data/*.wav` untouched. `start_preview.bat` still serves the repository root from port 8765. With the server running, refresh with Ctrl+Shift+R.

## Hardcoded WAV paths

`../motor_output/data/kick.wav`, `../motor_output/data/snare_1.wav`, `../motor_output/data/tom_1.wav`.

## Validation

Export still blocks overlapping percussion playback (according to the WAV durations), even if hits occur on different percussion tracks.
