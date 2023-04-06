import { createEvent, createStore, sample } from 'effector';
import {
  createListApi,
  createSwitch,
  createSelection,
  createItemApi,
  createGroup,
  createComputedField,
} from '@effector/keyval-core';

import type { Todo, InputTodo, ActiveTodo } from './types';

export const todos = createListApi<Todo, string>({
  keygen: () => `id-${Math.random().toString(36).slice(2, 10)}`,
});

export const addTodo = todos.addItemTree({
  normalize: (input: InputTodo) =>
    typeof input === 'string' ? { title: input } : input,
  convertInput: ({ title, parentTask }, childOf) => ({
    title,
    titleEdited: title,
    completed: false,
    editing: false,
    childOf: parentTask ?? childOf,
  }),
  getChilds: (item) => item.subtasks,
});
export const toggleAll = todos.setAll('completed');
export const clearCompleted = todos.removeItemsByField('completed');

export const taskTreeSelection = createSwitch({
  cases: {
    active: createSelection(
      todos,
      (todo): todo is ActiveTodo => !todo.completed
    ),
    completed: createSelection(todos, ({ completed }) => completed),
    all: createSelection(todos, () => true),
  },
  initialCase: 'all',
});

export const subtasksVisibleAmount = createComputedField({
  kv: todos,
  aggregateField: 'childOf',
  fn: (childs) => childs.length,
  selection: taskTreeSelection,
  defaultValue: 0,
});

export const subtasksTotalAmount = createComputedField({
  kv: todos,
  aggregateField: 'childOf',
  fn: (childs) => childs.length,
  defaultValue: 0,
});

export const $count = taskTreeSelection.state.size;

export const subtaskGroups = createGroup({
  selection: taskTreeSelection,
  field: 'childOf',
});

export const todoItemApi = createItemApi({
  kv: todos,
  events: {
    toggle: todos.mapItem(({ completed }) => ({ completed: !completed })),
    save: todos.mapItem(({ titleEdited }) => ({
      editing: false,
      title: titleEdited.trim(),
    })),
    remove: todos.removeItem({
      removeChilds: { childField: 'childOf' },
    }),
    setEditing: todos.setItemField('editing'),
    editMode: todos.mapItem(({ title }, mode: 'on' | 'off') => ({
      editing: mode === 'on',
      titleEdited: title,
    })),
    onChange: todos.setItemField('titleEdited'),
  },
});

export const changeDraft = createEvent<string>();
export const $descriptionDraft = createStore('')
  .on(changeDraft, (_, text) => text)
  .reset(addTodo);
export const addTodoFromDraft = createEvent<{ childOf: string | null }>();

sample({
  clock: addTodoFromDraft,
  source: $descriptionDraft,
  filter: (title) => title.length > 0,
  fn: (title, { childOf }) => ({ title, parentTask: childOf }),
  target: addTodo,
});

addTodo([
  '🖱 Double-click to edit',
  'React',
  {
    title: 'Effector',
    subtasks: [
      {
        title: 'subtask #1',
        subtasks: ['Foo', 'Bar'],
      },
      'subtask #2',
    ],
  },
]);
