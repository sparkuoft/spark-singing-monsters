# Expectations for subteam tasks

Each tasks needs a init() and loop(), one subteam can have multiple tasks

The init() must not depend on other tasks

To signal events from peripheral task to controller task create an Event object and call event_queue_push()

If task requires information from controller it should expose its own static QueueHandle_t and functions
