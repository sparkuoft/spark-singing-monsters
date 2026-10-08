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

const cppCodeOutput =
    document.getElementById("cppCodeOutput");

const copyCodeButton =
    document.getElementById("copyCodeButton");

const copyMessage =
    document.getElementById("copyMessage");


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
// This stores the CLEAN generated C++.
//
// The visual code display has line numbers.
// This string does not.
//
// Copy C++ copies this string.
//
// ============================================================

let generatedCppCode = "";


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

    selectedEventID =
        eventID;


    clearMessages();

    renderNotes();

    updateEditor();
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

    const snapInterval =
        getSnapInterval();


    const gridWidth =
        (
            snapInterval /
            1000
        ) *
        PIXELS_PER_SECOND;


    const tracks =
        motorLanes.querySelectorAll(
            ".motor-track"
        );


    tracks.forEach(
        track => {

            track.style.backgroundSize =
                gridWidth +
                "px 100%";
        }
    );
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


    if (
        noteEvents.length === 0
    ) {

        statusMessage.textContent =
            "Add at least one note before previewing.";

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
}


// ============================================================
// CHECK TIMELINE LENGTH CHANGE
// ============================================================

function changeTimelineLength() {

    clearMessages();


    let requestedLengthSeconds =
        Number(
            timelineLengthInput.value
        );


    requestedLengthSeconds =
        Math.max(
            1,
            Math.min(
                60,
                requestedLengthSeconds
            )
        );


    const requestedLengthMs =
        requestedLengthSeconds *
        1000;


    // Find latest note end.
    let latestEndTime =
        0;


    for (
        const noteEvent
        of noteEvents
    ) {

        const eventEnd =
            noteEvent.startTime +
            noteEvent.noteDuration;


        latestEndTime =
            Math.max(
                latestEndTime,
                eventEnd
            );
    }


    // Don't shorten timeline through existing notes.
    if (
        latestEndTime >
        requestedLengthMs
    ) {

        const minimumLengthSeconds =
            Math.ceil(
                latestEndTime /
                1000
            );


        timelineLengthInput.value =
            minimumLengthSeconds;


        statusMessage.textContent =
            "The timeline cannot be shortened past an existing note.";

        return;
    }


    timelineLengthInput.value =
        requestedLengthSeconds;


    updateTimeDisplay();

    createTimelineRuler();

    createMotorLanes();
}


// ============================================================
// SNAP INTERVAL CHANGE
// ============================================================

function changeSnapInterval() {

    clearMessages();


    // Validates/clamps the input.
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

function generateCppCode(
    songName,
    sortedEvents,
    songDuration,
    loopSong
) {

    const lines =
        [];


    lines.push(
        `NoteEvent ${songName}[] = {`
    );


    let previousMotor =
        null;


    for (
        const noteEvent
        of sortedEvents
    ) {

        // ----------------------------------------------------
        // NEW MOTOR GROUP
        // ----------------------------------------------------

        if (
            noteEvent.motorNum !==
            previousMotor
        ) {

            if (
                previousMotor !==
                null
            ) {

                lines.push("");
            }


            lines.push(
                `    // Motor ${noteEvent.motorNum}`
            );


            previousMotor =
                noteEvent.motorNum;
        }


        // ----------------------------------------------------
        // NOTE EVENT
        // ----------------------------------------------------

        lines.push(
            `    {${noteEvent.motorNum}, ${noteEvent.note}, ${noteEvent.startTime}, ${noteEvent.noteDuration}, false, false},`
        );
    }


    lines.push(
        "};"
    );


    lines.push(
        ""
    );


    lines.push(
        `const int ${songName}Length =`
    );


    lines.push(
        `    sizeof(${songName}) / sizeof(${songName}[0]);`
    );

    lines.push(
    ""
    );


    lines.push(
        `const unsigned long ${songName}Duration = ${songDuration};`
    );


    lines.push(
        ""
    );


    lines.push(
        `const bool ${songName}Loop = ${loopSong};`
    );


    return lines.join(
        "\n"
    );
}


// ============================================================
// GENERATE LEFT EVENT REFERENCE LIST
// ============================================================

function generateEventReferenceList(
    sortedEvents
) {

    eventReferenceList.innerHTML =
        "";


    let currentMotor =
        null;


    let currentMotorGroup =
        null;


    let eventNumber =
        1;


    for (
        const noteEvent
        of sortedEvents
    ) {

        // ----------------------------------------------------
        // CREATE MOTOR HEADING
        // ----------------------------------------------------

        if (
            noteEvent.motorNum !==
            currentMotor
        ) {

            currentMotor =
                noteEvent.motorNum;


            currentMotorGroup =
                document.createElement(
                    "div"
                );


            currentMotorGroup.className =
                "motor-event-group";


            const motorHeading =
                document.createElement(
                    "h4"
                );


            motorHeading.textContent =
                "Motor " +
                currentMotor;


            currentMotorGroup.appendChild(
                motorHeading
            );


            eventReferenceList.appendChild(
                currentMotorGroup
            );
        }


        // ----------------------------------------------------
        // EVENT ROW
        // ----------------------------------------------------

        const eventReference =
            document.createElement(
                "div"
            );


        eventReference.className =
            "event-reference";


        // Event number
        const number =
            document.createElement(
                "div"
            );


        number.className =
            "event-number";


        number.textContent =
            eventNumber +
            ".";


        // Event details
        const details =
            document.createElement(
                "div"
            );


        details.className =
            "event-details";


        const noteName =
            document.createElement(
                "div"
            );


        noteName.className =
            "event-note-name";


        noteName.textContent =
            getDisplayNoteName(
                noteEvent.note
            );


        const start =
            document.createElement(
                "div"
            );


        start.textContent =
            "Start: " +
            noteEvent.startTime +
            " ms";


        const duration =
            document.createElement(
                "div"
            );


        duration.textContent =
            "Duration: " +
            noteEvent.noteDuration +
            " ms";


        details.appendChild(
            noteName
        );


        details.appendChild(
            start
        );


        details.appendChild(
            duration
        );


        eventReference.appendChild(
            number
        );


        eventReference.appendChild(
            details
        );


        currentMotorGroup.appendChild(
            eventReference
        );


        eventNumber++;
    }
}


// ============================================================
// ADD A NORMAL LINE TO C++ DISPLAY
// ============================================================

function appendPlainCodeLine(
    text
) {

    const line =
        document.createElement(
            "div"
        );


    // Preserve intentional blank lines.
    if (text === "") {

        line.innerHTML =
            "&nbsp;";
    }

    else {

        line.textContent =
            text;
    }


    cppCodeOutput.appendChild(
        line
    );
}


// ============================================================
// DISPLAY GENERATED C++
// ============================================================
//
// Unlike generatedCppCode, this version adds visual event
// numbers beside each NoteEvent line.
//
// Those numbers are UI only.
//
// ============================================================

function displayCppCode(
    songName,
    sortedEvents,
    songDuration,
    loopSong
) {

    cppCodeOutput.innerHTML =
        "";


    appendPlainCodeLine(
        `NoteEvent ${songName}[] = {`
    );


    let previousMotor =
        null;


    let eventNumber =
        1;


    for (
        const noteEvent
        of sortedEvents
    ) {

        // ----------------------------------------------------
        // MOTOR GROUP
        // ----------------------------------------------------

        if (
            noteEvent.motorNum !==
            previousMotor
        ) {

            if (
                previousMotor !==
                null
            ) {

                appendPlainCodeLine(
                    ""
                );
            }


            appendPlainCodeLine(
                `    // Motor ${noteEvent.motorNum}`
            );


            previousMotor =
                noteEvent.motorNum;
        }


        // ----------------------------------------------------
        // NUMBERED EVENT LINE
        // ----------------------------------------------------

        const line =
            document.createElement(
                "div"
            );


        line.className =
            "cpp-event-line";


        const number =
            document.createElement(
                "span"
            );


        number.className =
            "cpp-line-number";


        number.textContent =
            eventNumber +
            ".";


        const code =
            document.createElement(
                "span"
            );


        code.className =
            "cpp-line-code";


        code.textContent =
            `    {${noteEvent.motorNum}, ${noteEvent.note}, ${noteEvent.startTime}, ${noteEvent.noteDuration}, false, false},`;


        line.appendChild(
            number
        );


        line.appendChild(
            code
        );


        cppCodeOutput.appendChild(
            line
        );


        eventNumber++;
    }


    appendPlainCodeLine(
        "};"
    );


    appendPlainCodeLine(
        ""
    );


    appendPlainCodeLine(
        `const int ${songName}Length =`
    );


    appendPlainCodeLine(
        `    sizeof(${songName}) / sizeof(${songName}[0]);`
    );

    appendPlainCodeLine(
    ""
    );


    appendPlainCodeLine(
        `const unsigned long ${songName}Duration = ${songDuration};`
    );


    appendPlainCodeLine(
        ""
    );


    appendPlainCodeLine(
        `const bool ${songName}Loop = ${loopSong};`
    );
}


// ============================================================
// GENERATE SONG OUTPUT
// ============================================================

function generateSongOutput() {

    clearMessages();


    copyMessage.textContent =
        "";


    // --------------------------------------------------------
    // SONG MUST CONTAIN AT LEAST ONE EVENT
    // --------------------------------------------------------

    if (
        noteEvents.length === 0
    ) {

        statusMessage.textContent =
            "Add at least one note before generating code.";

        return;
    }


    // --------------------------------------------------------
    // VALIDATE SONG NAME
    // --------------------------------------------------------

    const songName = songNameInput.value.trim();
    const songDuration = Number(timelineLengthInput.value) * 1000;
    const loopSong = loopSongInput.checked;

    if (
        !isValidCppIdentifier(
            songName
        )
    ) {

        statusMessage.textContent =
            "Song Name must be a valid C++ variable name. Use letters, numbers, and underscores, and do not begin with a number.";

        return;
    }


    // --------------------------------------------------------
    // SORT COPY
    // --------------------------------------------------------

    const sortedEvents =
        getSortedEventsForCode();


    // --------------------------------------------------------
    // CREATE CLEAN COPYABLE C++
    // --------------------------------------------------------

    generatedCppCode =
        generateCppCode(
            songName,
            sortedEvents,
            songDuration,
            loopSong
        );


    // --------------------------------------------------------
    // CREATE LEFT REFERENCE LIST
    // --------------------------------------------------------

    generateEventReferenceList(
        sortedEvents
    );


    // --------------------------------------------------------
    // CREATE RIGHT C++ DISPLAY
    // --------------------------------------------------------

    displayCppCode(
        songName,
        sortedEvents,
        songDuration,
        loopSong
    );


    // --------------------------------------------------------
    // SHOW OUTPUT
    // --------------------------------------------------------

    generatedOutput.classList.remove(
        "hidden"
    );
}


// ============================================================
// COPY GENERATED C++
// ============================================================

async function copyGeneratedCode() {

    if (!generatedCppCode) {

        copyMessage.textContent =
            "Generate code first.";

        return;
    }


    // --------------------------------------------------------
    // MODERN CLIPBOARD API
    // --------------------------------------------------------

    try {

        await navigator.clipboard.writeText(
            generatedCppCode
        );


        copyMessage.textContent =
            "C++ copied to clipboard.";


        return;
    }

    catch (error) {

        // file:// pages can sometimes be denied access
        // to navigator.clipboard depending on browser settings.
        //
        // Try a fallback below.
    }


    // --------------------------------------------------------
    // LOCAL-FILE FALLBACK
    // --------------------------------------------------------

    try {

        const temporaryTextArea =
            document.createElement(
                "textarea"
            );


        temporaryTextArea.value =
            generatedCppCode;


        temporaryTextArea.style.position =
            "fixed";


        temporaryTextArea.style.opacity =
            "0";


        document.body.appendChild(
            temporaryTextArea
        );


        temporaryTextArea.focus();

        temporaryTextArea.select();


        const copySucceeded =
            document.execCommand(
                "copy"
            );


        temporaryTextArea.remove();


        if (!copySucceeded) {

            throw new Error(
                "Fallback copy failed."
            );
        }


        copyMessage.textContent =
            "C++ copied to clipboard.";
    }

    catch (error) {

        copyMessage.textContent =
            "Could not access the clipboard. Select and copy the code manually.";


        console.error(
            "Clipboard error:",
            error
        );
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


copyCodeButton.addEventListener(
    "click",
    copyGeneratedCode
);


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
        }
    }
);


// ============================================================
// INITIALIZE PAGE
// ============================================================

createMotorLanes();

createTimelineRuler();

updateTimeDisplay();

updateEditor();