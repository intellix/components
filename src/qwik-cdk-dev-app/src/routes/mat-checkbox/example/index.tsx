import {component$, useSignal, useStyles$} from '@builder.io/qwik';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';
import styles from './example.css?inline';

interface Task {
  name: string;
  completed: boolean;
  subtasks?: Task[];
}

const INITIAL_TASK: Task = {
  name: 'Parent task',
  completed: false,
  subtasks: [
    {name: 'Child task 1', completed: false},
    {name: 'Child task 2', completed: false},
    {name: 'Child task 3', completed: false},
  ],
};

/**
 * Module-level pure helper (not component-local — a plain helper shared
 * across several `$()` closures needs to live at module scope to
 * serialize). Mirrors upstream's `update()` method body
 * (`task.update(task => {...})`): returns a brand-new `Task` rather than
 * mutating in place, so assigning it to the signal is what triggers
 * reactivity.
 */
function nextTask(task: Task, completed: boolean, index?: number): Task {
  const next: Task = {...task, subtasks: task.subtasks?.map(t => ({...t}))};
  if (index === undefined) {
    next.completed = completed;
    next.subtasks?.forEach(t => (t.completed = completed));
  } else if (next.subtasks) {
    next.subtasks[index] = {...next.subtasks[index], completed};
    next.completed = next.subtasks.every(t => t.completed);
  }
  return next;
}

/** Mirrors upstream's `partiallyComplete` computed signal. */
function partiallyComplete(task: Task): boolean {
  if (!task.subtasks) return false;
  return task.subtasks.some(t => t.completed) && !task.subtasks.every(t => t.completed);
}

// Port of src/components-examples/material/checkbox/checkbox-overview
// (checkbox-overview-example.html/.ts/.css) — material.angular.dev's "Basic
// checkboxes" example. The first two checkboxes ("Check me!", "Disabled")
// have no [checked] binding upstream — rendered with no `checked` prop at
// all, same as /mat-checkbox/aria-label's convention for a self-managed
// checkbox.
//
// The 3 subtasks are each their own `<li><MatCheckbox checked={task.value
// .subtasks[i].completed} .../></li>` call, NOT a `task.value.subtasks
// .map(...)` loop — confirmed empirically that the `.map()` form breaks
// cross-render reactivity here: each mapped `<MatCheckbox>`'s `checked`
// prop keeps rendering the value from the render that CREATED it, even
// though the signal, the enclosing component's re-render, and the prop
// EXPRESSION itself (`task.value.subtasks[i].completed`, a direct `.value`
// read, not hidden behind a helper) all visibly carry the new value by the
// time of that re-render. Dropping `.map()` for 3 explicit calls — which
// upstream's own fixed 3-subtask array makes a reasonable, un-hacky port
// choice either way — fixes it. Likely a Qwik keyed-list child-prop-update
// gap; not investigated further here.
export default component$(() => {
  useStyles$(styles);
  const task = useSignal<Task>(INITIAL_TASK);

  return (
    <>
      <div data-parity-root>
        <checkbox-overview-example>
          <section class="example-section">
            <MatCheckbox class="example-margin">Check me!</MatCheckbox>
            <MatCheckbox class="example-margin" disabled>
              Disabled
            </MatCheckbox>
          </section>

          <section class="example-section">
            <span class="example-list-section">
              <MatCheckbox
                class="example-margin"
                checked={task.value.completed}
                indeterminate={partiallyComplete(task.value)}
                onChange$={event => {
                  task.value = nextTask(task.value, event.checked);
                }}
              >
                {task.value.name}
              </MatCheckbox>
            </span>
            <span class="example-list-section">
              <ul>
                <li>
                  <MatCheckbox
                    checked={task.value.subtasks![0].completed}
                    onChange$={event => {
                      task.value = nextTask(task.value, event.checked, 0);
                    }}
                  >
                    {task.value.subtasks![0].name}
                  </MatCheckbox>
                </li>
                <li>
                  <MatCheckbox
                    checked={task.value.subtasks![1].completed}
                    onChange$={event => {
                      task.value = nextTask(task.value, event.checked, 1);
                    }}
                  >
                    {task.value.subtasks![1].name}
                  </MatCheckbox>
                </li>
                <li>
                  <MatCheckbox
                    checked={task.value.subtasks![2].completed}
                    onChange$={event => {
                      task.value = nextTask(task.value, event.checked, 2);
                    }}
                  >
                    {task.value.subtasks![2].name}
                  </MatCheckbox>
                </li>
              </ul>
            </span>
          </section>
        </checkbox-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
