// ============================================================
// MOTOR MUSIC SEQUENCER
// script.js
// ============================================================
//
// Main responsibilities:
//
// 1. Store the song as noteEvents[]
// 2. Draw/edit notes on the timeline
// 3. Prevent invalid note placement and motor overlaps
// 4. Preview the song using Web Audio
// 5. Move a playhead during preview
// 6. Generate C++ NoteEvent code for the ESP32 project
//
// ============================================================


// ============================================================
// CONSTANTS
// ============================================================

// Number of horizontal pixels representing one second.
const PIXELS_PER_SECOND = 200;


// Width of the Motor label column.
//
// The actual musical timeline begins after this column,
// so the playhead must be offset by this amount.
const TIMELINE_LABEL_WIDTH = 100;


// ============================================================
// MAIN DOM ELEMENTS
// ============================================================

const motorCountInput =
    document.getElementById("motorCount");

const timelineLengthInput =
    document.getElementById("timelineLength");

const snapIntervalInput =
    document.getElementById("snapInterval");

const songNameInput =
    document.getElementById("songName");

const loopSongInput =
    document.getElementById("loopSong");


// ============================================================
// SELECTED NOTE EDITOR
// ============================================================

const noteEditor =
    document.getElementById("noteEditor");

const editNoteSelect =
    document.getElementById("editNoteSelect");

const editMotorInput =
    document.getElementById("editMotor");

const editStartTimeInput =
    document.getElementById("editStartTime");

const editDurationInput =
    document.getElementById("editDuration");

const applyEditButton =
    document.getElementById("applyEditButton");

const deleteNoteButton =
    document.getElementById("deleteNoteButton");

const editorMessage =
    document.getElementById("editorMessage");


// ============================================================
// TIMELINE
// ============================================================

const rulerTrack =
    document.getElementById("rulerTrack");

const motorLanes =
    document.getElementById("motorLanes");

const timeDisplay =
    document.getElementById("timeDisplay");

const playhead =
    document.getElementById("playhead");


// ============================================================
// STATUS MESSAGE
// ============================================================

const statusMessage =
    document.getElementById("statusMessage");


// ============================================================
// PLAYBACK CONTROLS
// ============================================================

const playButton =
    document.getElementById("playButton");

const stopButton =
    document.getElementById("stopButton");


// ============================================================
// CODE GENERATOR ELEMENTS
// ============================================================

const generateCodeButton =
    document.getElementById("generateCodeButton");

const generatedOutput =
    document.getElementById("generatedOutput");

const eventReferenceList =
    document.getElementById("eventReferenceList");

const headerCodeOutput = document.getElementById("headerCodeOutput");
const sourceCodeOutput = document.getElementById("sourceCodeOutput");
const copyHeaderCodeButton = document.getElementById("copyHeaderCodeButton");
const copySourceCodeButton = document.getElementById("copySourceCodeButton");
const copyHeaderMessage = document.getElementById("copyHeaderMessage");
const copySourceMessage = document.getElementById("copySourceMessage");


// ============================================================
// NOTE FREQUENCIES
// ============================================================
//
// Internal note names intentionally match Notes.h.
//
// Example:
//
// UI display:       C#4
// JavaScript value: CS4
// C++ identifier:   CS4
//
// ============================================================

const NOTE_FREQUENCIES = {

    // Octave 4
    C4: 261.63,
    CS4: 277.18,
    D4: 293.66,
    DS4: 311.13,
    E4: 329.63,
    F4: 349.23,
    FS4: 369.99,
    G4: 392.00,
    GS4: 415.30,
    A4: 440.00,
    AS4: 466.16,
    B4: 493.88,

    // Octave 5
    C5: 523.25,
    CS5: 554.37,
    D5: 587.33,
    DS5: 622.25,
    E5: 659.25,
    F5: 698.46,
    FS5: 739.99,
    G5: 783.99,
    GS5: 830.61,
    A5: 880.00,
    AS5: 932.33,
    B5: 987.77,

    // Octave 6
    C6: 1046.50,
    CS6: 1108.73,
    D6: 1174.66,
    DS6: 1244.51,
    E6: 1318.51,
    F6: 1396.91,
    FS6: 1479.98,
    G6: 1567.98,
    GS6: 1661.22,
    A6: 1760.00,
    AS6: 1864.66,
    B6: 1975.53
};


// ============================================================
// SONG DATA
// ============================================================
//
// This is the source of truth for the song.
//
// The visual timeline, audio preview, editor, and C++ generator
// all read from this same array.
//
// ============================================================

const noteEvents = [];

// ============================================================
// HARDCODED SAMPLE PATHS (browser preview)
// ============================================================
//
// Reuse the same WAV files that are uploaded to ESP32 LittleFS.
// This script lives in motor_sequencer_and_cpp_generator/; motor_output/
// is a sibling directory. Start the HTTP server from the repository root.
//
// No file picker is needed; Preview loads these fixed paths automatically.
// When adding new sounds in the future, add another {id, name, file} entry
// here AND update the ESP32 sample ID -> LittleFS filename mapping.
// Browser paths are relative to index.html, NOT the ESP32's "/kick.wav" path.
// Future pitched instruments can reuse this registry, but sustained notes
// will also need note-duration and playback support in both systems.
//
const SAMPLE_LIBRARY = Object.freeze([
    { id: 1, name: "Kick",  file: "../motor_output/data/kick.wav" },
    { id: 2, name: "Snare", file: "../motor_output/data/snare_1.wav" },
    { id: 3, name: "Tom",   file: "../motor_output/data/tom_1.wav" }
]);
const sampleEvents = []; // {id, sampleID, startTime}; zero duration by design
let nextSampleEventID = 1;
let selectedSampleEventID = null;
let sampleInteraction = null;
const decodedSampleCache = new Map(); // sampleID -> {path, buffer}
let activeSampleNodes = [];

const percussionLanes = document.getElementById("percussionLanes");
const sampleEditor = document.getElementById("sampleEditor");
const editSampleSelect = document.getElementById("editSampleSelect");
const editSampleStartTime = document.getElementById("editSampleStartTime");
const sampleEditorMessage = document.getElementById("sampleEditorMessage");



// Each note gets a permanent unique ID.
//
// This is different from its position in noteEvents[] because
// deleting/sorting/displaying notes should not change identity.
let nextEventID = 1;


// ID of the note currently selected in the editor.
let selectedEventID = null;


// ============================================================
// DRAG / RESIZE STATE
// ============================================================

let interaction = null;


// ============================================================
// AUDIO PLAYBACK STATE
// ============================================================

let audioContext = null;


// AudioContext time at which the current preview begins.
let playbackStartTime = 0;


// Stores scheduled oscillators so Stop can silence them.
let activeAudioNodes = [];


// requestAnimationFrame ID for the playhead.
let playheadAnimationID = null;


// Whether preview is currently active.
let isPlaying = false;


// ============================================================
// CODE GENERATOR STATE
// ============================================================
//
// Two independently copyable snippets for the existing TestSong files.
// Neither contains a full replacement file or a duplicate include guard.
// ============================================================

let generatedHeaderCode = "";
let generatedSourceCode = "";


// ============================================================
// DISPLAY NOTE NAME
// ============================================================
//
// Converts our C++-friendly sharp notation into normal
// musical notation.
//
// CS4 -> C#4
// FS5 -> F#5
//
// ============================================================

function getDisplayNoteName(noteName) {

    return noteName
        .replace("CS", "C#")
        .replace("DS", "D#")
        .replace("FS", "F#")
        .replace("GS", "G#")
        .replace("AS", "A#");
}


// ============================================================
// BASIC TIMELINE HELPERS
// ============================================================

function getTimelineLengthMs() {

    return (
        Number(timelineLengthInput.value) *
        1000
    );
}


function getSnapInterval() {

    let snapInterval =
        Number(snapIntervalInput.value);


    if (
        !Number.isFinite(snapInterval) ||
        snapInterval < 1
    ) {

        snapInterval = 1;

        snapIntervalInput.value = 1;
    }


    return snapInterval;
}


function snapTime(timeMs) {

    const snapInterval =
        getSnapInterval();


    return (
        Math.round(
            timeMs / snapInterval
        ) *
        snapInterval
    );
}


function findEventByID(eventID) {

    return noteEvents.find(
        noteEvent =>
            noteEvent.id === eventID
    );
}


function clearMessages() {

    statusMessage.textContent = "";

    editorMessage.textContent = "";
}


// ============================================================
// VALIDATE NOTE PLACEMENT
// ============================================================
//
// Every way of changing a note uses this function:
//
// - adding
// - dragging
// - resizing
// - selected-note editor
//
// This gives us one consistent set of rules.
//
// ============================================================

function isValidPlacement(
    eventID,
    motorNum,
    startTime,
    noteDuration
) {

    const timelineLengthMs =
        getTimelineLengthMs();


    // Start and duration must be real numbers.
    if (
        !Number.isFinite(startTime) ||
        !Number.isFinite(noteDuration)
    ) {

        return false;
    }


    if (startTime < 0) {

        return false;
    }


    if (noteDuration <= 0) {

        return false;
    }


    const endTime =
        startTime +
        noteDuration;


    // Note cannot extend beyond the timeline.
    if (
        endTime >
        timelineLengthMs
    ) {

        return false;
    }


    // Motor must currently exist.
    const motorCount =
        Number(motorCountInput.value);


    if (
        motorNum < 1 ||
        motorNum > motorCount
    ) {

        return false;
    }


    // --------------------------------------------------------
    // SAME-MOTOR OVERLAP CHECK
    // --------------------------------------------------------

    for (
        const existingEvent
        of noteEvents
    ) {

        // Ignore the note currently being edited.
        if (
            existingEvent.id ===
            eventID
        ) {

            continue;
        }


        // Different motors may overlap freely.
        if (
            existingEvent.motorNum !==
            motorNum
        ) {

            continue;
        }


        const existingStart =
            existingEvent.startTime;


        const existingEnd =
            existingEvent.startTime +
            existingEvent.noteDuration;


        const overlaps =
            startTime < existingEnd &&
            endTime > existingStart;


        if (overlaps) {

            return false;
        }
    }


    return true;
}


// ============================================================
// CREATE MOTOR LANES
// ============================================================

function createMotorLanes() {

    motorLanes.innerHTML = "";


    const motorCount =
        Number(motorCountInput.value);


    const timelineWidth =
        Number(timelineLengthInput.value) *
        PIXELS_PER_SECOND;


    for (
        let motorNum = 1;
        motorNum <= motorCount;
        motorNum++
    ) {

        const lane =
            document.createElement("div");


        lane.className =
            "motor-lane";


        // ----------------------------------------------------
        // MOTOR LABEL
        // ----------------------------------------------------

        const label =
            document.createElement("div");


        label.className =
            "motor-label";


        label.textContent =
            "Motor " + motorNum;


        // ----------------------------------------------------
        // MOTOR TRACK
        // ----------------------------------------------------

        const track =
            document.createElement("div");


        track.className =
            "motor-track";


        track.dataset.motor =
            motorNum;


        track.style.width =
            timelineWidth + "px";


        track.addEventListener(
            "click",
            function (event) {

                addNoteFromClick(
                    event,
                    motorNum
                );
            }
        );


        lane.appendChild(
            label
        );


        lane.appendChild(
            track
        );


        motorLanes.appendChild(
            lane
        );
    }


    updateTrackGrid();

    renderNotes();
}


// ============================================================
// ADD NOTE FROM TIMELINE CLICK
// ============================================================

function addNoteFromClick(
    event,
    motorNum
) {

    // Changing the composition while old audio is scheduled
    // would make the preview disagree with the timeline.
    if (isPlaying) {

        stopPreview();
    }


    // Clicking an existing note should select/edit it,
    // not create another note underneath it.
    if (
        event.target.closest(
            ".note-block"
        )
    ) {

        return;
    }


    clearMessages();


    const track =
        event.currentTarget;


    const trackRect =
        track.getBoundingClientRect();


    const clickPositionPixels =
        event.clientX -
        trackRect.left;


    let startTime =
        (
            clickPositionPixels /
            PIXELS_PER_SECOND
        ) *
        1000;


    startTime =
        snapTime(startTime);


    const note = "C4";
    const noteDuration = 500;


    if (
        !Number.isFinite(noteDuration) ||
        noteDuration <= 0
    ) {

        statusMessage.textContent =
            "Note duration must be greater than 0 ms.";

        return;
    }


    if (
        !isValidPlacement(
            null,
            motorNum,
            startTime,
            noteDuration
        )
    ) {

        statusMessage.textContent =
            "That note would overlap another note on the same motor or extend outside the timeline.";

        return;
    }


    const newEvent = {

        id: nextEventID,

        motorNum: motorNum,

        note: note,

        startTime: startTime,

        noteDuration: noteDuration
    };


    nextEventID++;


    noteEvents.push(
        newEvent
    );


    selectedEventID =
        newEvent.id;


    renderNotes();

    updateEditor();
    hideGeneratedOutput();
}


// ============================================================
// RENDER NOTES
// ============================================================
//
// Deletes the OLD visual note blocks and recreates them from
// noteEvents[].
//
// noteEvents[] itself is NOT deleted.
//
// ============================================================

function renderNotes() {

    const existingBlocks =
        motorLanes.querySelectorAll(
            ".note-block"
        );


    existingBlocks.forEach(
        block => block.remove()
    );


    for (
        const noteEvent
        of noteEvents
    ) {

        const track =
            motorLanes.querySelector(
                `.motor-track[data-motor="${noteEvent.motorNum}"]`
            );


        if (!track) {

            continue;
        }


        const noteBlock =
            document.createElement(
                "div"
            );


        noteBlock.className =
            "note-block";


        noteBlock.dataset.eventId =
            noteEvent.id;


        if (
            noteEvent.id ===
            selectedEventID
        ) {

            noteBlock.classList.add(
                "selected-note"
            );
        }


        // ----------------------------------------------------
        // NOTE LABEL
        // ----------------------------------------------------

        const noteLabel =
            document.createElement(
                "span"
            );


        noteLabel.className =
            "note-label";


        noteLabel.textContent =
            getDisplayNoteName(
                noteEvent.note
            );


        noteBlock.appendChild(
            noteLabel
        );


        // ----------------------------------------------------
        // RESIZE HANDLE
        // ----------------------------------------------------

        const resizeHandle =
            document.createElement(
                "div"
            );


        resizeHandle.className =
            "resize-handle";


        noteBlock.appendChild(
            resizeHandle
        );


        // ----------------------------------------------------
        // POSITION / WIDTH
        // ----------------------------------------------------

        noteBlock.style.left =
            (
                noteEvent.startTime /
                1000 *
                PIXELS_PER_SECOND
            ) +
            "px";


        noteBlock.style.width =
            (
                noteEvent.noteDuration /
                1000 *
                PIXELS_PER_SECOND
            ) +
            "px";


        // ----------------------------------------------------
        // SELECT NOTE
        // ----------------------------------------------------

        noteBlock.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();


                selectNote(
                    noteEvent.id
                );
            }
        );


        // ----------------------------------------------------
        // START DRAG
        // ----------------------------------------------------

        noteBlock.addEventListener(
            "pointerdown",
            function (event) {

                // Resize handle has separate behavior.
                if (
                    event.target.closest(
                        ".resize-handle"
                    )
                ) {

                    return;
                }


                startDragging(
                    event,
                    noteEvent.id
                );
            }
        );


        // ----------------------------------------------------
        // START RESIZE
        // ----------------------------------------------------

        resizeHandle.addEventListener(
            "pointerdown",
            function (event) {

                event.stopPropagation();


                startResizing(
                    event,
                    noteEvent.id
                );
            }
        );


        track.appendChild(
            noteBlock
        );
    }
}


// ============================================================
// SELECT NOTE
// ============================================================

function selectNote(eventID) {
    selectedSampleEventID = null;
    selectedEventID = eventID;
    clearMessages();
    renderNotes();
    renderSampleHits();
    updateEditor();
    updateSampleEditor();
}


// ============================================================
// UPDATE SELECTED NOTE EDITOR
// ============================================================

function updateEditor() {

    const selectedEvent =
        findEventByID(
            selectedEventID
        );


    if (!selectedEvent) {

noteEditor.classList.add(
            "hidden"
        );

        return;
    }


    noteEditor.classList.remove(
        "hidden"
    );


    editNoteSelect.value =
        selectedEvent.note;


    editMotorInput.value =
        selectedEvent.motorNum;


    editMotorInput.max =
        motorCountInput.value;


    editStartTimeInput.value =
        selectedEvent.startTime;


    editDurationInput.value =
        selectedEvent.noteDuration;
}


// ============================================================
// APPLY SELECTED NOTE EDITS
// ============================================================

function applyEditorChanges() {

    if (isPlaying) {

        stopPreview();
    }


    clearMessages();


    const selectedEvent =
        findEventByID(
            selectedEventID
        );


    if (!selectedEvent) {

        return;
    }


    const newNote =
        editNoteSelect.value;


    const newMotorNum =
        Number(
            editMotorInput.value
        );


    let newStartTime =
        Number(
            editStartTimeInput.value
        );


    let newDuration =
        Number(
            editDurationInput.value
        );


    // Keep manual edits aligned with the current snap grid.
    newStartTime =
        snapTime(
            newStartTime
        );


    newDuration =
        snapTime(
            newDuration
        );


    if (
        newDuration <= 0
    ) {

        editorMessage.textContent =
            "Duration must be greater than 0 ms.";

        return;
    }


    if (
        !isValidPlacement(
            selectedEvent.id,
            newMotorNum,
            newStartTime,
            newDuration
        )
    ) {

        editorMessage.textContent =
            "That edit would overlap another note on the same motor or extend outside the timeline.";

        return;
    }


    // Only modify the real event AFTER validation succeeds.
    selectedEvent.note =
        newNote;


    selectedEvent.motorNum =
        newMotorNum;


    selectedEvent.startTime =
        newStartTime;


    selectedEvent.noteDuration =
        newDuration;


    renderNotes();

    updateEditor();
    hideGeneratedOutput();
}


// ============================================================
// DELETE SELECTED NOTE
// ============================================================

function deleteSelectedNote() {

    if (isPlaying) {

        stopPreview();
    }


    const eventIndex =
        noteEvents.findIndex(
            noteEvent =>
                noteEvent.id ===
                selectedEventID
        );


    if (
        eventIndex === -1
    ) {

        return;
    }


    noteEvents.splice(
        eventIndex,
        1
    );


    selectedEventID =
        null;


    clearMessages();

    renderNotes();

    updateEditor();
    hideGeneratedOutput();
}


// ============================================================
// START DRAGGING
// ============================================================

function startDragging(
    pointerEvent,
    eventID
) {

    // Editing the composition stops the current preview.
    if (isPlaying) {

        stopPreview();
    }


    pointerEvent.preventDefault();


    const noteEvent =
        findEventByID(
            eventID
        );


    if (!noteEvent) {

        return;
    }


    selectNote(
        eventID
    );


    interaction = {

        type: "drag",

        eventID: eventID,

        startPointerX:
            pointerEvent.clientX,

        originalStartTime:
            noteEvent.startTime
    };


    document.addEventListener(
        "pointermove",
        handlePointerMove
    );


    document.addEventListener(
        "pointerup",
        finishPointerInteraction
    );
}


// ============================================================
// START RESIZING
// ============================================================

function startResizing(
    pointerEvent,
    eventID
) {

    // Editing the composition stops the current preview.
    if (isPlaying) {

        stopPreview();
    }


    pointerEvent.preventDefault();


    const noteEvent =
        findEventByID(
            eventID
        );


    if (!noteEvent) {

        return;
    }


    selectNote(
        eventID
    );


    interaction = {

        type: "resize",

        eventID: eventID,

        startPointerX:
            pointerEvent.clientX,

        originalDuration:
            noteEvent.noteDuration
    };


    document.addEventListener(
        "pointermove",
        handlePointerMove
    );


    document.addEventListener(
        "pointerup",
        finishPointerInteraction
    );
}


// ============================================================
// HANDLE DRAG / RESIZE MOVEMENT
// ============================================================

function handlePointerMove(
    pointerEvent
) {

    if (!interaction) {

        return;
    }


    const noteEvent =
        findEventByID(
            interaction.eventID
        );


    if (!noteEvent) {

        return;
    }


    const deltaPixels =
        pointerEvent.clientX -
        interaction.startPointerX;


    const deltaMs =
        (
            deltaPixels /
            PIXELS_PER_SECOND
        ) *
        1000;


    // --------------------------------------------------------
    // DRAG
    // --------------------------------------------------------

    if (
        interaction.type ===
        "drag"
    ) {

        const proposedStartTime =
            snapTime(
                interaction.originalStartTime +
                deltaMs
            );


        if (
            isValidPlacement(
                noteEvent.id,
                noteEvent.motorNum,
                proposedStartTime,
                noteEvent.noteDuration
            )
        ) {

            noteEvent.startTime =
                proposedStartTime;


            renderNotes();

            updateEditor();
            hideGeneratedOutput();
        }
    }


    // --------------------------------------------------------
    // RESIZE
    // --------------------------------------------------------

    else if (
        interaction.type ===
        "resize"
    ) {

        let proposedDuration =
            snapTime(
                interaction.originalDuration +
                deltaMs
            );


        proposedDuration =
            Math.max(
                getSnapInterval(),
                proposedDuration
            );


        if (
            isValidPlacement(
                noteEvent.id,
                noteEvent.motorNum,
                noteEvent.startTime,
                proposedDuration
            )
        ) {

            noteEvent.noteDuration =
                proposedDuration;


            renderNotes();

            updateEditor();
            hideGeneratedOutput();
        }
    }
}


// ============================================================
// FINISH DRAG / RESIZE
// ============================================================

function finishPointerInteraction() {

    interaction =
        null;


    document.removeEventListener(
        "pointermove",
        handlePointerMove
    );


    document.removeEventListener(
        "pointerup",
        finishPointerInteraction
    );
}


// ============================================================
// CREATE TIMELINE RULER
// ============================================================

function createTimelineRuler() {

    rulerTrack.innerHTML = "";


    const timelineLengthMs =
        getTimelineLengthMs();


    const timelineWidth =
        Number(
            timelineLengthInput.value
        ) *
        PIXELS_PER_SECOND;


    rulerTrack.style.width =
        timelineWidth + "px";


    const snapInterval =
        getSnapInterval();


    for (
        let time = 0;
        time <= timelineLengthMs;
        time += snapInterval
    ) {

        const marker =
            document.createElement(
                "div"
            );


        marker.style.left =
            (
                time /
                1000 *
                PIXELS_PER_SECOND
            ) +
            "px";


        if (
            time % 500 === 0
        ) {

            marker.className =
                "ruler-marker major-marker";


            const label =
                document.createElement(
                    "span"
                );


            label.textContent =
                (
                    time /
                    1000
                ).toFixed(1) +
                " s";


            marker.appendChild(
                label
            );
        }

        else {

            marker.className =
                "ruler-marker minor-marker";
        }


        rulerTrack.appendChild(
            marker
        );
    }


    updateTrackGrid();
}


// ============================================================
// UPDATE TRACK GRID
// ============================================================

function updateTrackGrid() {
    const gridWidth = (getSnapInterval() / 1000) * PIXELS_PER_SECOND;
    document.querySelectorAll(".motor-track, .percussion-track").forEach(track => {
        track.style.backgroundSize = gridWidth + "px 100%";
    });
}


// ============================================================
// UPDATE TIME DISPLAY
// ============================================================

function updateTimeDisplay() {

    const timelineLengthSeconds =
        Number(
            timelineLengthInput.value
        );


    timeDisplay.textContent =
        "0.00 / " +
        timelineLengthSeconds.toFixed(2) +
        " s";
}


// ============================================================
// AUDIO CONTEXT
// ============================================================

function getAudioContext() {

    if (!audioContext) {

        audioContext =
            new AudioContext();
    }


    return audioContext;
}


// ============================================================
// PREVIEW SONG
// ============================================================

async function previewSong() {

    // Restart from the beginning if Preview is pressed again.
    stopPreview();


    clearMessages();


    if (noteEvents.length === 0 && sampleEvents.length === 0) {

        statusMessage.textContent =
            "Add at least one motor note or percussion hit before previewing.";

        return;
    }


    const context =
        getAudioContext();


    if (
        context.state ===
        "suspended"
    ) {

        await context.resume();
    }


    // Load WAVs from the hardcoded paths before scheduling on the same clock.
    const sampleBuffers = new Map();
    const missingNames = [];
    for (const instrument of SAMPLE_LIBRARY) {
        if (!sampleEvents.some(hit => hit.sampleID === instrument.id)) continue;
        try {
            const buffer = await getSampleBuffer(instrument.id, context);
            if (buffer) sampleBuffers.set(instrument.id, buffer);
            else missingNames.push(instrument.name);
        } catch (error) {
            missingNames.push(instrument.name);
            console.warn("Could not decode sample", instrument.name, error);
        }
    }
    if (missingNames.length) {
        statusMessage.textContent = "Could not load WAV(s): " + missingNames.join(", ") + ". Check SAMPLE_LIBRARY paths and run this page from a server rooted at spark-singing-monsters/. Available sounds and motor notes still play.";
    }

    isPlaying =
        true;


    // Small scheduling buffer.
    playbackStartTime =
        context.currentTime +
        0.05;


    activeAudioNodes =
        [];


    // --------------------------------------------------------
    // SCHEDULE EVERY NOTE
    // --------------------------------------------------------

    for (
        const noteEvent
        of noteEvents
    ) {

        const frequency =
            NOTE_FREQUENCIES[
                noteEvent.note
            ];


        if (!frequency) {

            console.warn(
                "Unknown note:",
                noteEvent.note
            );

            continue;
        }


        const oscillator =
            context.createOscillator();


        const gainNode =
            context.createGain();


        oscillator.type =
            "sine";


        oscillator.frequency.value =
            frequency;


        oscillator.connect(
            gainNode
        );


        gainNode.connect(
            context.destination
        );


        const noteStartTime =
            playbackStartTime +
            (
                noteEvent.startTime /
                1000
            );


        const noteDurationSeconds =
            noteEvent.noteDuration /
            1000;


        const noteEndTime =
            noteStartTime +
            noteDurationSeconds;


        // ----------------------------------------------------
        // SMALL ATTACK / RELEASE
        // ----------------------------------------------------
        //
        // Avoids sharp clicks when oscillators begin/end.
        //
        // Attack/release are also limited for extremely
        // short notes so the ramps cannot cross each other.
        //
        // ----------------------------------------------------

        const attackTime =
            Math.min(
                0.005,
                noteDurationSeconds / 4
            );


        const releaseTime =
            Math.min(
                0.01,
                noteDurationSeconds / 4
            );


        gainNode.gain.setValueAtTime(
            0,
            noteStartTime
        );


        gainNode.gain.linearRampToValueAtTime(
            0.12,
            noteStartTime +
            attackTime
        );


        const releaseStart =
            Math.max(
                noteStartTime +
                attackTime,
                noteEndTime -
                releaseTime
            );


        gainNode.gain.setValueAtTime(
            0.12,
            releaseStart
        );


        gainNode.gain.linearRampToValueAtTime(
            0,
            noteEndTime
        );


        oscillator.start(
            noteStartTime
        );


        oscillator.stop(
            noteEndTime
        );


        activeAudioNodes.push({

            oscillator: oscillator,

            gainNode: gainNode
        });
    }


    // The ESP32 has ONE sample player. Each later percussion hit
    // immediately cuts off the previous hit, rather than mixing them.
    scheduleSamplePreview(context, sampleBuffers);

    playhead.style.display =
        "block";


    updatePlayhead();
}


// ============================================================
// UPDATE PLAYHEAD
// ============================================================

function updatePlayhead() {

    if (
        !isPlaying ||
        !audioContext
    ) {

        return;
    }


    let elapsedSeconds =
        audioContext.currentTime -
        playbackStartTime;


    // The scheduling buffer means this will briefly be negative.
    elapsedSeconds =
        Math.max(
            0,
            elapsedSeconds
        );


    const timelineLengthSeconds =
        Number(
            timelineLengthInput.value
        );


    // --------------------------------------------------------
    // END OF TIMELINE
    // --------------------------------------------------------

    if (
        elapsedSeconds >=
        timelineLengthSeconds
    ) {

        finishPreview();

        return;
    }


    // --------------------------------------------------------
    // MOVE PLAYHEAD
    // --------------------------------------------------------

    const playheadPosition =
        TIMELINE_LABEL_WIDTH +
        (
            elapsedSeconds *
            PIXELS_PER_SECOND
        );


    playhead.style.left =
        playheadPosition +
        "px";


    // --------------------------------------------------------
    // TIME DISPLAY
    // --------------------------------------------------------

    timeDisplay.textContent =
        elapsedSeconds.toFixed(2) +
        " / " +
        timelineLengthSeconds.toFixed(2) +
        " s";


    playheadAnimationID =
        requestAnimationFrame(
            updatePlayhead
        );
}


// ============================================================
// STOP PREVIEW
// ============================================================

function stopPreview() {

    for (
        const audioNode
        of activeAudioNodes
    ) {

        try {

            audioNode.oscillator.stop();
        }

        catch (error) {

            // Harmless if oscillator has already stopped.
        }
    }


    activeAudioNodes =
        [];

    for (const source of activeSampleNodes) {
        try { source.stop(); } catch (error) { /* already stopped */ }
    }
    activeSampleNodes = [];

    if (
        playheadAnimationID !==
        null
    ) {

        cancelAnimationFrame(
            playheadAnimationID
        );


playheadAnimationID =
            null;
    }


    isPlaying =
        false;


    resetPlayhead();
}


// ============================================================
// FINISH PREVIEW NATURALLY
// ============================================================

function finishPreview() {

    activeAudioNodes =
        [];

    for (const source of activeSampleNodes) {
        try { source.stop(); } catch (error) { /* already stopped */ }
    }
    activeSampleNodes = [];

    if (
        playheadAnimationID !==
        null
    ) {

        cancelAnimationFrame(
            playheadAnimationID
        );


        playheadAnimationID =
            null;
    }


    isPlaying =
        false;


    resetPlayhead();
}


// ============================================================
// RESET PLAYHEAD
// ============================================================

function resetPlayhead() {

    playhead.style.display =
        "none";


    playhead.style.left =
        TIMELINE_LABEL_WIDTH +
        "px";


    updateTimeDisplay();
}


// ============================================================
// CHECK MOTOR COUNT CHANGE
// ============================================================

function changeMotorCount() {

    clearMessages();


    let requestedMotorCount =
        Number(
            motorCountInput.value
        );


    // Clamp input to supported range.
    requestedMotorCount =
        Math.max(
            1,
            Math.min(
                6,
                requestedMotorCount
            )
        );


    motorCountInput.value =
        requestedMotorCount;


    // Find the highest-numbered motor currently containing notes.
    let highestUsedMotor =
        0;


    for (
        const noteEvent
        of noteEvents
    ) {

        highestUsedMotor =
            Math.max(
                highestUsedMotor,
                noteEvent.motorNum
            );
    }


    // Don't silently delete/hide existing notes.
    if (
        requestedMotorCount <
        highestUsedMotor
    ) {

        motorCountInput.value =
            highestUsedMotor;


        statusMessage.textContent =
            "Cannot remove a motor lane that still contains notes. Delete or move those notes first.";

        return;
    }


    createMotorLanes();

    createTimelineRuler();

    updateEditor();
    hideGeneratedOutput();
}


// ============================================================
// CHECK TIMELINE LENGTH CHANGE
// ============================================================

function changeTimelineLength() {
    clearMessages();
    const rawSeconds = Number(timelineLengthInput.value);
    const requestedSeconds = Number.isFinite(rawSeconds) ? Math.max(1, Math.min(60, Math.ceil(rawSeconds))) : 5;
    const requestedMs = requestedSeconds * 1000;
    let latestEnd = 0;
    for (const note of noteEvents) latestEnd = Math.max(latestEnd, note.startTime + note.noteDuration);
    for (const hit of sampleEvents) latestEnd = Math.max(latestEnd, hit.startTime + 1);
    if (latestEnd > requestedMs) {
        timelineLengthInput.value = Math.ceil(latestEnd / 1000);
        statusMessage.textContent = "Timeline cannot end before an existing note or percussion hit. Remove or move the event first.";
        return;
    }
    timelineLengthInput.value = requestedSeconds;
    if (isPlaying) stopPreview();
    createTimelineRuler();
    createMotorLanes();
    createPercussionLanes();
    updateTimeDisplay();
    hideGeneratedOutput();
}


// ============================================================
// SNAP INTERVAL CHANGE
// ============================================================

function changeSnapInterval() {
    clearMessages();
    getSnapInterval();
    createTimelineRuler();
    updateTrackGrid();
}


// ============================================================
// C++ SONG NAME VALIDATION
// ============================================================

function isValidCppIdentifier(
    name
) {

    // Basic C++ identifier rule for this tool:
    //
    // - first character = letter or underscore
    // - remaining characters = letters, numbers, underscores

    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(
        name
    );
}


// ============================================================
// SORT EVENTS FOR GENERATED CODE
// ============================================================
//
// IMPORTANT:
//
// We sort a COPY.
//
// The real noteEvents[] remains untouched.
//
// Generated order:
//
// Motor 1
//   earliest -> latest
//
// Motor 2
//   earliest -> latest
//
// Motor 3
//   earliest -> latest
//
// etc.
//
// ============================================================

function getSortedEventsForCode() {

    const sortedEvents =
        [...noteEvents];


    sortedEvents.sort(
        function (
            eventA,
            eventB
        ) {

            // Primary sort:
            // motor number.
            if (
                eventA.motorNum !==
                eventB.motorNum
            ) {

                return (
                    eventA.motorNum -
                    eventB.motorNum
                );
            }


            // Secondary sort:
            // start time.
            return (
                eventA.startTime -
                eventB.startTime
            );
        }
    );


    return sortedEvents;
}


// ============================================================
// GENERATE CLEAN C++ STRING
// ============================================================
//
// This string is what gets copied to the clipboard.
//
// It intentionally does NOT contain the visual event numbers.
//
// ============================================================

// Build code that can be PASTED inside existing TestSong.h and TestSong.cpp.
// The header already includes Sequencer.h and the source already includes
// Arduino.h, TestSong.h, and Notes.h. Do not repeat those includes.
// Looping is controlled by the .ino call to updateSequencer(), not by
// declarations in TestSong.h/.cpp.
function generateCppCode(timelineName, sortedNotes, timelineDuration) {
    const noteArray = timelineName + "Notes";
    const sampleArray = timelineName + "Samples";
    const timelineObject = timelineName + "Timeline";
    const sortedSamples = getSortedSamplesForCode();

    // Paste this single declaration alongside the other extern Timelines.
    const headerCode = `extern const Timeline ${timelineObject};`;

    const lines = [
        `// ${timelineName}`,
        ""
    ];

    if (sortedNotes.length) {
        lines.push(`NoteEvent ${noteArray}[] = {`);
        let previousMotor = null;
        for (const note of sortedNotes) {
            if (note.motorNum !== previousMotor) {
                if (previousMotor !== null) lines.push("");
                lines.push(`    // Motor ${note.motorNum}`);
                previousMotor = note.motorNum;
            }
            lines.push(`    {${note.motorNum}, ${note.note}, ${note.startTime}, ${note.noteDuration}, false, false},`);
        }
        lines.push("};", "");
    }

    if (sortedSamples.length) {
        lines.push(`SampleEvent ${sampleArray}[] = {`);
        for (const hit of sortedSamples) {
            const instrument = getSampleInstrument(hit.sampleID);
            lines.push(`    {${hit.sampleID}, ${hit.startTime}, false}, // ${instrument.name}`);
        }
        lines.push("};", "");
    }

    // Empty event types use nullptr and 0. For nonempty arrays, calculate
    // the count the same way as the existing handwritten TestSong.cpp.
    const notePointer = sortedNotes.length ? noteArray : "nullptr";
    const noteCount = sortedNotes.length
        ? `sizeof(${noteArray}) / sizeof(${noteArray}[0])`
        : "0";
    const samplePointer = sortedSamples.length ? sampleArray : "nullptr";
    const sampleCount = sortedSamples.length
        ? `sizeof(${sampleArray}) / sizeof(${sampleArray}[0])`
        : "0";

    lines.push(
        `const Timeline ${timelineObject} = {`,
        `    "${timelineName}",`,
        `    ${notePointer},`,
        `    ${noteCount},`,
        `    ${samplePointer},`,
        `    ${sampleCount},`,
        `    ${timelineDuration}`,
        "};"
    );
    return { headerCode, sourceCode: lines.join("\n") };
}


// ============================================================
// GENERATE LEFT EVENT REFERENCE LIST
// ============================================================

function generateEventReferenceList(sortedNotes) {
    eventReferenceList.innerHTML = "";
    function addGroup(title, events, format) {
        if (!events.length) return;
        const group = document.createElement("div");
        group.className = "motor-event-group";
        const heading = document.createElement("h4");
        heading.textContent = title;
        group.appendChild(heading);
        events.forEach((ev, index) => {
            const row = document.createElement("div");
            row.className = "event-reference";
            const number = document.createElement("span");
            number.className = "event-number";
            number.textContent = (index + 1) + ".";
            const desc = document.createElement("span");
            desc.className = "event-details";
            desc.textContent = format(ev);
            row.append(number, desc);
            group.appendChild(row);
        });
        eventReferenceList.appendChild(group);
    }
    for (let m = 1; m <= Number(motorCountInput.value); m++) {
        addGroup("Motor " + m, sortedNotes.filter(note => note.motorNum === m),
            note => `${getDisplayNoteName(note.note)} · ${note.startTime} ms · ${note.noteDuration} ms long`);
    }
    addGroup("Percussion", getSortedSamplesForCode(), hit =>
        `${getSampleInstrument(hit.sampleID).name} (ID ${hit.sampleID}) · ${hit.startTime} ms`);
}


// ============================================================
// DISPLAY BOTH PASTE-READY CODE SNIPPETS
// ============================================================
function displayCppCode() {
    // A <pre> retains indentation and lets users select/copy directly.
    // Buttons copy only the corresponding snippet, not both files at once.
    headerCodeOutput.textContent = generatedHeaderCode;
    sourceCodeOutput.textContent = generatedSourceCode;
}


// ============================================================
// PERCUSSION EXPORT CHECK: ONLY ONE ACTIVE WAV AT A TIME
// ============================================================
//
// SampleEvent contains only a start time, not a duration.
// To detect real playback overlap we read the length of each WAV file.
// This checks the EXACT WAVs also used by the ESP32 (not just equal times).
// Motor notes can still overlap each other and percussion normally.
// A missing/unreadable WAV blocks export because its duration is unknown.
//
async function validatePercussionForExport() {
    const hits = getSortedSamplesForCode();
    if (hits.length < 2) return { ok: true };

    // Simultaneous hits always conflict, even before checking WAV durations.
    for (let i = 1; i < hits.length; i++) {
        if (hits[i].startTime === hits[i - 1].startTime) {
            const first = getSampleInstrument(hits[i - 1].sampleID);
            const second = getSampleInstrument(hits[i].sampleID);
            return {
                ok: false,
                message: `Cannot export: overlapping percussion events at ${hits[i].startTime} ms ` +
                    `(${first?.name ?? "Unknown"} and ${second?.name ?? "Unknown"}). ` +
                    `The ESP32 currently plays only one WAV sample at a time. ` +
                    `Move or delete one of these hits.`
            };
        }
    }

    const durationsMs = new Map();
    let context;
    try {
        context = getAudioContext();
        for (const hit of hits) {
            if (durationsMs.has(hit.sampleID)) continue;
            const instrument = getSampleInstrument(hit.sampleID);
            if (!instrument) throw new Error(`Unknown sample ID ${hit.sampleID}`);
            const buffer = await getSampleBuffer(hit.sampleID, context);
            if (!buffer || !Number.isFinite(buffer.duration) || buffer.duration <= 0) {
                throw new Error(`Could not determine the duration of ${instrument.name}`);
            }
            durationsMs.set(hit.sampleID, Math.ceil(buffer.duration * 1000));
        }
    } catch (error) {
        console.error("Percussion export validation failed:", error);
        return {
            ok: false,
            message: "Cannot export: unable to check percussion overlaps because a WAV " +
                "file could not be loaded. Check the sample paths and local server. " +
                `Details: ${error.message}`
        };
    }

    const timelineEnd = getTimelineLengthMs();
    for (let i = 0; i < hits.length - 1; i++) {
        const current = hits[i];
        const next = hits[i + 1];
        const currentEnd = Math.min(
            timelineEnd,
            current.startTime + durationsMs.get(current.sampleID)
        );

        if (next.startTime < currentEnd) {
            const first = getSampleInstrument(current.sampleID).name;
            const second = getSampleInstrument(next.sampleID).name;
            return {
                ok: false,
                message: `Cannot export: overlapping percussion events. ` +
                    `${first} starts at ${current.startTime} ms and plays until about ${currentEnd} ms, ` +
                    `but ${second} starts at ${next.startTime} ms. ` +
                    `The ESP32 currently plays only one WAV sample at a time. ` +
                    `Move the second hit later or remove one of the hits.`
            };
        }
    }

    return { ok: true };
}

// ============================================================
// GENERATE SONG OUTPUT
// ============================================================

async function generateSongOutput() {
    clearMessages();
    hideGeneratedOutput(); // Never leave old C++ visible/copyable after an invalid export.

    if (!noteEvents.length && !sampleEvents.length) {
        statusMessage.textContent = "Add at least one motor note or percussion hit before generating code.";
        return;
    }
    const timelineName = songNameInput.value.trim();
    const duration = getTimelineLengthMs();
    if (!isValidCppIdentifier(timelineName)) {
        statusMessage.textContent = "Timeline Name must be a valid C++ identifier (letters, numbers, underscores; cannot start with number).";
        return;
    }

    generateCodeButton.disabled = true;
    try {
        if (sampleEvents.length >= 2) {
            statusMessage.textContent = "Checking percussion sample durations for overlaps...";
            const result = await validatePercussionForExport();
            if (!result.ok) {
                statusMessage.textContent = result.message;
                return; // No C++ output generated.
            }
        }

        statusMessage.textContent = "";
        const sortedNotes = getSortedEventsForCode();
        const snippets = generateCppCode(timelineName, sortedNotes, duration);
        generatedHeaderCode = snippets.headerCode;
        generatedSourceCode = snippets.sourceCode;
        generateEventReferenceList(sortedNotes);
        displayCppCode();
        generatedOutput.classList.remove("hidden");
    } finally {
        generateCodeButton.disabled = false;
    }
}


// ============================================================
// COPY ONE PASTE-READY SNIPPET
// ============================================================
async function copyCodeSnippet(code, messageElement) {
    if (!code) {
        messageElement.textContent = "Generate code first.";
        return;
    }
    try {
        await navigator.clipboard.writeText(code);
        messageElement.textContent = "Copied! Paste into your existing file.";
        return;
    } catch (error) {
        // Fallback for browsers without clipboard permission.
    }
    const input = document.createElement("textarea");
    input.value = code;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.focus();
    input.select();
    try {
        if (!document.execCommand("copy")) throw new Error("Copy failed");
        messageElement.textContent = "Copied! Paste into your existing file.";
    } catch (error) {
        messageElement.textContent = "Unable to copy automatically. Select the code above and copy it manually.";
        console.error("Clipboard error:", error);
    } finally {
        input.remove();
    }
}


// ============================================================
// EVENT LISTENERS
// ============================================================


// ------------------------------------------------------------
// Code generator
// ------------------------------------------------------------

generateCodeButton.addEventListener(
    "click",
    generateSongOutput
);


copyHeaderCodeButton.addEventListener("click", () =>
    copyCodeSnippet(generatedHeaderCode, copyHeaderMessage));
copySourceCodeButton.addEventListener("click", () =>
    copyCodeSnippet(generatedSourceCode, copySourceMessage));


// ------------------------------------------------------------
// Playback
// ------------------------------------------------------------

playButton.addEventListener(
    "click",
    previewSong
);


stopButton.addEventListener(
    "click",
    stopPreview
);


// ------------------------------------------------------------
// Settings
// ------------------------------------------------------------

motorCountInput.addEventListener(
    "change",
    changeMotorCount
);


timelineLengthInput.addEventListener(
    "change",
    changeTimelineLength
);


snapIntervalInput.addEventListener(
    "change",
    changeSnapInterval
);


// ------------------------------------------------------------
// Selected note editor
// ------------------------------------------------------------

applyEditButton.addEventListener(
    "click",
    applyEditorChanges
);


deleteNoteButton.addEventListener(
    "click",
    deleteSelectedNote
);


// ------------------------------------------------------------
// Keyboard delete
// ------------------------------------------------------------

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key !== "Delete" &&
            event.key !== "Backspace"
        ) {

            return;
        }


        // Do NOT delete notes while the user is typing
        // inside an input/select/textarea.
        const activeElement =
            document.activeElement;


        if (
            activeElement &&
            (
                activeElement.tagName === "INPUT" ||
                activeElement.tagName === "SELECT" ||
                activeElement.tagName === "TEXTAREA"
            )
        ) {

            return;
        }


        if (
            selectedEventID !==
            null
        ) {

            event.preventDefault();

            deleteSelectedNote();
        } else if (selectedSampleEventID !== null) {
            event.preventDefault();
            deleteSelectedSample();
        }
    }
);


// ============================================================
// PERCUSSION EXTENSION + TIMELINE SAVE / LOAD
// ============================================================

function getSampleInstrument(sampleID) {
    return SAMPLE_LIBRARY.find(instrument => instrument.id === sampleID);
}

function findSampleEventByID(eventID) {
    return sampleEvents.find(hit => hit.id === eventID);
}

function getSortedSamplesForCode() {
    // Sort by start time. Simultaneous hits are rejected at C++ export.
    return [...sampleEvents].sort((a, b) =>
        a.startTime - b.startTime || a.sampleID - b.sampleID || a.id - b.id
    );
}

function isValidSamplePlacement(eventID, sampleID, startTime) {
    if (!getSampleInstrument(sampleID) || !Number.isInteger(startTime)) return false;
    if (startTime < 0 || startTime >= getTimelineLengthMs()) return false;
    // Two hits of the same instrument at exactly the same time are redundant.
    return !sampleEvents.some(hit =>
        hit.id !== eventID && hit.sampleID === sampleID && hit.startTime === startTime
    );
}

function createPercussionLanes() {
    percussionLanes.innerHTML = "";
    const width = Number(timelineLengthInput.value) * PIXELS_PER_SECOND;
    for (const instrument of SAMPLE_LIBRARY) {
        const lane = document.createElement("div");
        lane.className = "percussion-lane";
        const label = document.createElement("div");
        label.className = "percussion-label";
        label.textContent = instrument.name;
        const track = document.createElement("div");
        track.className = "percussion-track";
        track.dataset.sampleId = instrument.id;
        track.style.width = width + "px";
        track.addEventListener("click", event => {
            if (event.target.closest(".percussion-hit")) return;
            if (isPlaying) stopPreview();
            const position = event.clientX - track.getBoundingClientRect().left;
            const startTime = snapTime((position / PIXELS_PER_SECOND) * 1000);
            if (!isValidSamplePlacement(null, instrument.id, startTime)) {
                statusMessage.textContent = "That hit would duplicate an existing hit or fall outside the timeline.";
                return;
            }
            const hit = { id: nextSampleEventID++, sampleID: instrument.id, startTime };
            sampleEvents.push(hit);
            selectSample(hit.id);
            hideGeneratedOutput();
        });
        lane.append(label, track);
        percussionLanes.appendChild(lane);
    }
    updateTrackGrid();
    renderSampleHits();
}

function renderSampleHits() {
    percussionLanes.querySelectorAll(".percussion-hit").forEach(block => block.remove());
    for (const hit of sampleEvents) {
        const track = percussionLanes.querySelector(`.percussion-track[data-sample-id="${hit.sampleID}"]`);
        if (!track) continue;
        const block = document.createElement("div");
        block.className = "percussion-hit";
        if (hit.id === selectedSampleEventID) block.classList.add("selected-hit");
        block.dataset.sampleId = hit.sampleID;
        block.textContent = "●";
        block.title = `${getSampleInstrument(hit.sampleID).name} at ${hit.startTime} ms`;
        block.style.left = (hit.startTime / 1000 * PIXELS_PER_SECOND) + "px";
        // Tiny trigger block, rather than a duration-sized bar.
        block.style.width = Math.max(16, Math.min(30, getSnapInterval() / 1000 * PIXELS_PER_SECOND)) + "px";
        block.addEventListener("click", event => {
            event.stopPropagation();
            selectSample(hit.id);
        });
        block.addEventListener("pointerdown", event => startSampleDragging(event, hit.id));
        track.appendChild(block);
    }
}

function selectSample(eventID) {
    selectedEventID = null;
    selectedSampleEventID = eventID;
    clearMessages();
    renderNotes();
    updateEditor();
    renderSampleHits();
    updateSampleEditor();
}

function updateSampleEditor() {
    const hit = findSampleEventByID(selectedSampleEventID);
    sampleEditor.classList.toggle("hidden", !hit);
    if (!hit) return;
    editSampleSelect.value = String(hit.sampleID);
    editSampleStartTime.value = hit.startTime;
    sampleEditorMessage.textContent = "";
}

function applySampleEditorChanges() {
    if (isPlaying) stopPreview();
    const hit = findSampleEventByID(selectedSampleEventID);
    if (!hit) return;
    const sampleID = Number(editSampleSelect.value);
    const rawStart = Number(editSampleStartTime.value);
    const startTime = snapTime(rawStart);
    if (!Number.isFinite(rawStart) || !isValidSamplePlacement(hit.id, sampleID, startTime)) {
        sampleEditorMessage.textContent = "Invalid hit: check instrument, time, duplicates, and timeline length.";
        return;
    }
    hit.sampleID = sampleID;
    hit.startTime = startTime;
    selectSample(hit.id);
    hideGeneratedOutput();
}

function deleteSelectedSample() {
    if (isPlaying) stopPreview();
    const index = sampleEvents.findIndex(hit => hit.id === selectedSampleEventID);
    if (index < 0) return;
    sampleEvents.splice(index, 1);
    selectedSampleEventID = null;
    renderSampleHits();
    updateSampleEditor();
    clearMessages();
    hideGeneratedOutput();
}

function startSampleDragging(event, eventID) {
    if (isPlaying) stopPreview();
    event.preventDefault();
    const hit = findSampleEventByID(eventID);
    if (!hit) return;
    selectSample(eventID);
    sampleInteraction = {
        eventID, startPointerX: event.clientX, originalStartTime: hit.startTime
    };
    document.addEventListener("pointermove", moveSampleDrag);
    document.addEventListener("pointerup", finishSampleDrag);
    document.addEventListener("pointercancel", finishSampleDrag);
}

function moveSampleDrag(event) {
    if (!sampleInteraction) return;
    const hit = findSampleEventByID(sampleInteraction.eventID);
    if (!hit) return;
    const deltaMs = (event.clientX - sampleInteraction.startPointerX) / PIXELS_PER_SECOND * 1000;
    const proposed = snapTime(sampleInteraction.originalStartTime + deltaMs);
    if (isValidSamplePlacement(hit.id, hit.sampleID, proposed)) {
        hit.startTime = proposed;
        renderSampleHits();
        updateSampleEditor();
        hideGeneratedOutput();
    }
}

function finishSampleDrag() {
    sampleInteraction = null;
    document.removeEventListener("pointermove", moveSampleDrag);
    document.removeEventListener("pointerup", finishSampleDrag);
    document.removeEventListener("pointercancel", finishSampleDrag);
}

async function getSampleBuffer(sampleID, context) {
    const instrument = getSampleInstrument(sampleID);
    if (!instrument) return null;

    // Reuse already-decoded audio for subsequent previews.
    const cached = decodedSampleCache.get(sampleID);
    if (cached?.path === instrument.file) return cached.buffer;

    // fetch() reads relative URLs from the sequencer's own folder, not LittleFS.
    // Browsers typically block fetch() when index.html is opened as file://,
    // so run this folder through a local HTTP server (see README.md).
    const response = await fetch(instrument.file);
    if (!response.ok) {
        throw new Error(`${instrument.file}: HTTP ${response.status}`);
    }
    const bytes = await response.arrayBuffer();
    const buffer = await context.decodeAudioData(bytes);
    decodedSampleCache.set(sampleID, { path: instrument.file, buffer });
    return buffer;
}

function scheduleSamplePreview(context, buffers) {
    activeSampleNodes = [];
    const ordered = getSortedSamplesForCode();
    const timelineEnd = playbackStartTime + getTimelineLengthMs() / 1000;
    for (let i = 0; i < ordered.length; i++) {
        const hit = ordered[i];
        const buffer = buffers.get(hit.sampleID);
        if (!buffer) continue;
        const begin = playbackStartTime + hit.startTime / 1000;
        // Even a hit whose file is missing interrupts the current sample on
        // the ESP32, so look at ALL upcoming events, not only decoded buffers.
        const nextHit = ordered[i + 1];
        const nextStart = nextHit ? playbackStartTime + nextHit.startTime / 1000 : timelineEnd;
        const end = Math.min(begin + buffer.duration, nextStart, timelineEnd);
        if (end <= begin) continue; // simultaneous earlier hit: later one wins
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        gain.gain.value = 0.6;
        source.connect(gain);
        gain.connect(context.destination);
        source.start(begin);
        source.stop(end);
        activeSampleNodes.push(source);
    }
}

function setupSampleLibrary() {
    const list = document.getElementById("sampleFileGrid");
    for (const instrument of SAMPLE_LIBRARY) {
        const option = document.createElement("option");
        option.value = String(instrument.id);
        option.textContent = instrument.name;
        editSampleSelect.appendChild(option);

        // Display the configured path; there are no WAV upload controls.
        const entry = document.createElement("div");
        entry.className = "sample-file-entry";
        const name = document.createElement("strong");
        name.textContent = instrument.name;
        const path = document.createElement("span");
        path.className = "sample-path";
        path.textContent = `ID ${instrument.id} · ${instrument.file}`;
        entry.append(name, path);
        list.appendChild(entry);
    }
    document.getElementById("applySampleEditButton").addEventListener("click", applySampleEditorChanges);
    document.getElementById("deleteSampleButton").addEventListener("click", deleteSelectedSample);
}

function hideGeneratedOutput() {
    generatedHeaderCode = "";
    generatedSourceCode = "";
    headerCodeOutput.textContent = "";
    sourceCodeOutput.textContent = "";
    generatedOutput.classList.add("hidden");
    copyHeaderMessage.textContent = "";
    copySourceMessage.textContent = "";
}

// The JSON is intentionally small, readable, and free of binary WAV data.
function getTimelineProject() {
    return {
        format: "ece3-sound-production-timeline", version: 1,
        name: songNameInput.value.trim(),
        motorCount: Number(motorCountInput.value),
        timelineLengthSeconds: Number(timelineLengthInput.value),
        snapIntervalMs: getSnapInterval(),
        loop: loopSongInput.checked,
        notes: noteEvents.map(note => ({
            motorNum: note.motorNum, note: note.note,
            startTime: note.startTime, noteDuration: note.noteDuration
        })),
        samples: sampleEvents.map(hit => ({ sampleID: hit.sampleID, startTime: hit.startTime }))
    };
}

function saveTimelineProject() {
    const project = getTimelineProject();
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const objectURL = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectURL;
    const safeName = project.name.replace(/[^A-Za-z0-9_-]/g, "_") || "timeline";
    anchor.download = safeName + ".json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Defer cleanup until the browser has started the download.
    setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
    statusMessage.textContent = "Timeline project saved. WAV files are not embedded in JSON.";
}

function loadTimelineProject(project) {
    if (!project || project.format !== "ece3-sound-production-timeline" || project.version !== 1 ||
        !Array.isArray(project.notes) || !Array.isArray(project.samples)) {
        throw new Error("Not an ECE3 timeline JSON file (version 1).");
    }
    const motorCount = Number(project.motorCount);
    const seconds = Number(project.timelineLengthSeconds);
    const snap = Number(project.snapIntervalMs);
    if (!Number.isInteger(motorCount) || motorCount < 1 || motorCount > 6 ||
        !Number.isInteger(seconds) || seconds < 1 || seconds > 60 ||
        !Number.isInteger(snap) || snap < 1 || !isValidCppIdentifier(String(project.name))) {
        throw new Error("Timeline settings are invalid.");
    }
    const lengthMs = seconds * 1000;
    const notes = project.notes.map((raw, index) => {
        const note = { id: index + 1, motorNum: raw.motorNum, note: raw.note,
            startTime: raw.startTime, noteDuration: raw.noteDuration };
        if (!Number.isInteger(note.motorNum) || note.motorNum < 1 || note.motorNum > motorCount ||
            !Object.hasOwn(NOTE_FREQUENCIES, note.note) ||
            !Number.isInteger(note.startTime) || note.startTime < 0 ||
            !Number.isInteger(note.noteDuration) || note.noteDuration <= 0 ||
            note.startTime + note.noteDuration > lengthMs) {
            throw new Error("Invalid motor note at index " + index + ".");
        }
        return note;
    });
    for (let i = 0; i < notes.length; i++) {
        for (let j = i + 1; j < notes.length; j++) {
            if (notes[i].motorNum === notes[j].motorNum &&
                notes[i].startTime < notes[j].startTime + notes[j].noteDuration &&
                notes[j].startTime < notes[i].startTime + notes[i].noteDuration) {
                throw new Error("Overlapping notes on motor " + notes[i].motorNum + ".");
            }
        }
    }
    const samples = project.samples.map((raw, index) => {
        const hit = { id: index + 1, sampleID: raw.sampleID, startTime: raw.startTime };
        if (!getSampleInstrument(hit.sampleID) || !Number.isInteger(hit.startTime) ||
            hit.startTime < 0 || hit.startTime >= lengthMs) {
            throw new Error("Invalid percussion hit at index " + index + ".");
        }
        return hit;
    });
    const seen = new Set();
    for (const hit of samples) {
        const key = hit.sampleID + ":" + hit.startTime;
        if (seen.has(key)) throw new Error("Duplicate percussion hits at " + hit.startTime + " ms.");
        seen.add(key);
    }
    if (isPlaying) stopPreview();
    songNameInput.value = project.name;
    motorCountInput.value = motorCount;
    timelineLengthInput.value = seconds;
    snapIntervalInput.value = snap;
    loopSongInput.checked = Boolean(project.loop);
    noteEvents.splice(0, noteEvents.length, ...notes);
    sampleEvents.splice(0, sampleEvents.length, ...samples);
    nextEventID = notes.length + 1;
    nextSampleEventID = samples.length + 1;
    selectedEventID = null;
    selectedSampleEventID = null;
    createMotorLanes();
    createPercussionLanes();
    createTimelineRuler();
    updateEditor();
    updateSampleEditor();
    updateTimeDisplay();
    hideGeneratedOutput();
    statusMessage.textContent = `Loaded ${project.name}: ${notes.length} motor notes, ${samples.length} percussion hits. Browser WAVs use the fixed paths in script.js.`;
}

function newTimelineProject() {
    if ((noteEvents.length || sampleEvents.length) &&
        !window.confirm("Start a new timeline? Save the current one to JSON first if you want to keep it.")) return;
    stopPreview();
    noteEvents.splice(0);
    sampleEvents.splice(0);
    nextEventID = 1;
    nextSampleEventID = 1;
    selectedEventID = null;
    selectedSampleEventID = null;
    songNameInput.value = "newTimeline";
    createMotorLanes();
    createPercussionLanes();
    updateEditor();
    updateSampleEditor();
    hideGeneratedOutput();
    statusMessage.textContent = "New empty timeline. Sample paths are configured in script.js.";
}

function setupTimelineFileButtons() {
    document.getElementById("newTimelineButton").addEventListener("click", newTimelineProject);
    document.getElementById("saveTimelineButton").addEventListener("click", saveTimelineProject);
    document.getElementById("loadTimelineInput").addEventListener("change", async function () {
        const file = this.files?.[0];
        if (!file) return;
        try {
            const project = JSON.parse(await file.text());
            loadTimelineProject(project);
        } catch (error) {
            statusMessage.textContent = "Could not load timeline: " + error.message;
        } finally {
            this.value = ""; // allows reloading the same JSON
        }
    });
}


// ============================================================
// INITIALIZE PAGE
// ============================================================

createMotorLanes();
createPercussionLanes();
createTimelineRuler();
updateTimeDisplay();
updateEditor();
updateSampleEditor();
setupSampleLibrary();
setupTimelineFileButtons();
songNameInput.addEventListener("input", hideGeneratedOutput);
loopSongInput.addEventListener("change", hideGeneratedOutput);
