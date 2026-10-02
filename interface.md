# Integration Notes
Subteams should group functionality into separate files, such that they run on setup/loop

The init()/tick() should be the actual hardware manipulation

Call event_emit(...) to tell game FSM something

Expose setter commands to game FSM, these should not do any hardware updates leave that to tick()

Mayt need multiple functions???
