#include "tasks.h"
#include "config.h"
#include "controller.h"
#include "inputs.h"
// Include the other random files for subteam tasks

typedef struct {
  const char* name;
  void (*init)();
  void (*loop)();
  uint32_t period; // in ms (0 if loop blocks on its own)
  uint32_t stack_size; // in bytes
  UBaseType_t priority; // 0 is lowest priority 
  BaseType_t core;
} Task; // TODO: Need to track handles for suspending all???
// Does vTaskSuspendAll work for multi-core

static const Task tasks[] = {
  {"controller", controller_init, controller_loop, 10, 4096, 2, 1},
  {"inputs", inputs_init, inputs_loop, 5, 4096, 3, 1}
  // Add other subteam tasks here;
};

#define NUM_TASKS (sizeof(tasks) / sizeof(tasks[0])) // MUST BE <=24

static EventGroupHandle_t init_group;

static void task_entry(void *arg) {
  const Task *t = (const Task*)arg;

  t->init();

  // DEBUG
  Serial.printf("%s init done, core %d, priority %u\n", t->name, (int)xPortGetCoreID(), (unsigned)uxTaskPriorityGet(NULL));
  uint32_t count = 0;

  // IMPORTANT: If someone has slow blocking code in init, other tasks (ex. encoder) may have problems
  xEventGroupSetBits(init_group, 1 << (t - tasks));
  xEventGroupWaitBits(init_group, (1 << NUM_TASKS)-1, pdFALSE, pdTRUE, portMAX_DELAY);
  // If eventgroup fails this will hang without error message

  TickType_t prev_wake = xTaskGetTickCount();
  while (1) {
    // DEBUG
    if (count++ % 500 == 0) {
      Serial.printf("%s: %u bytes stack free\n", t->name, (unsigned)uxTaskGetStackHighWaterMark(NULL));
    }

    t->loop();
    if (t->period > 0) {
      xTaskDelayUntil(&prev_wake, pdMS_TO_TICKS(t->period));
      // May be problematic, need to check return value for task called after set time 
    }
  }
}

void tasks_init() { 
  init_group = xEventGroupCreate(); // NEED NULL ERROR CHECKING

  for (int i = 0; i < NUM_TASKS; i++) {
    const Task *t = &tasks[i];
    if (xTaskCreatePinnedToCore(task_entry, t->name, t->stack_size, (void*)t, t->priority, NULL, t->core) != pdPASS) {
      Serial.printf("Task create failed, %s", t->name);
      while (1) delay(1000); // Find more clean way of doing this?
      // Also probably should use vTaskDelay
    }
  }
}
