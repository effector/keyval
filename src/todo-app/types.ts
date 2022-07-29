export type Todo = {
  id: string
  title: string
  completed: boolean
  editing: boolean
  titleEdited: string
  childOf: string | null
}

export type InputTodo =
  | string
  | {title: string; parentTask?: string | null; subtasks?: InputTodo[]}
