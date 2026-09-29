#include "tasks.h"
#include "controller.h"
// Include the other random files for subteam tasks

typedef struct {
  // Inputs to pass into pinned to core task creation
} HardwareTask;

static const HardwareTask hardware_tasks[] = {
  // List all subteam based tasks, not the game thing
};

static void hardware_task(void *arg) {
  const HardwareTask *t = (const HardwareTask *)arg;

  while (1) {

  }
}

static void game_task(void *arg) {
  (void)arg; // Compiler shut up
  controller_init();
  while (1) {
    controller_loop();
    //vTaskDelay(/*Convert ticks later*/);
  }
}

void tasks_init() {
  for () {
    // Hardware tasks
  }
  // Game task
  // xTaskCreatePinnedToCore();
}
