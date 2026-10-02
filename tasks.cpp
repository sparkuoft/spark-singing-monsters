#include "tasks.h"
#include "controller.h"
// Include the other random files for subteam tasks

static EventGroupHandle_t init_group;

typedef struct {
  // Inputs to pass into pinned to core task creation
} Task;

static const Task tasks[] = {
  // List all subteam based tasks, not the game thing
};

#define NUM_TASKS (sizeof(tasks) / sizeof(tasks[0]))

static void task_entry(void *arg) { // Gotta redo this, idk
  const Task *t = (const Task*)arg;

  controller_init();
  while (1) {
    controller_loop();
    //vTaskDelay(/*Convert ticks later*/);
  }
}

void tasks_init() { // Also broken, redo
  init_group = xEventGroupCreate();

  for (int i = 0; i < NUM_TASKS; i++) {
    xTaskCreatePinnedToCore(task_entry, ...);
  }
}
