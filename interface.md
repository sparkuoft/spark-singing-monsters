# Integration Notes
Subteams should group functionality into separate files, such that they run on setup/loop

The init()/loop() should be the actual hardware manipulation

Call event_queue_push(...) to tell game FSM something

Need more queues to talk to peripherals? Need to figure out
