import './main.css'
import type {KeyboardEvent, ChangeEvent} from 'react'
import {useStore} from 'effector-react'
import {
  useItemState,
  useItemApi,
  useGroup,
  useComputedField,
} from '@effector/keyval-react'

import {
  $count,
  taskTreeSelection,
  addTodo,
  clearCompleted,
  toggleAll,
  todoItemApi,
  subtaskGroups,
  subtasksVisibleAmount,
  subtasksTotalAmount,
  changeDraft,
  addTodoFromDraft,
  $descriptionDraft,
} from './model'

export const TodoApp = () => {
  const draft = useStore($descriptionDraft)
  const onChangeDraft = (e: ChangeEvent<HTMLInputElement>) => {
    changeDraft(e.target.value)
  }
  const onAddTodo = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const input = e.currentTarget
    if (input.value && input.value.trim()) {
      addTodo({
        title: input.value.trim(),
        parentTask: null,
      })
    }
  }
  const onToggleAll = (e: ChangeEvent<HTMLInputElement>) => {
    toggleAll(e.currentTarget.checked)
  }
  const onClearCompleted = () => clearCompleted()
  return (
    <section className="todoapp">
      <div>
        <header className="header">
          <h1>TodoApp</h1>
          <input
            className="new-todo"
            placeholder="What needs to be done?"
            onKeyDown={onAddTodo}
            onChange={onChangeDraft}
            value={draft}
          />
        </header>
        <section className="main">
          <input
            type="checkbox"
            className="toggle-all"
            id="toggle-all"
            onChange={onToggleAll}
          />
          <label htmlFor="toggle-all" />
          <TodoSubtree nesting={0} id={null} />
        </section>
        <footer className="footer">
          <TodoCount />
          <TodoFilters />
          <button
            type="button"
            className="clear-completed"
            onClick={onClearCompleted}
          >
            Clear completed
          </button>
        </footer>
      </div>
    </section>
  )
}

export const TodoCount = () => {
  const count = useStore($count)
  return (
    <span className="todo-count">
      <strong>{count}</strong>
      <span>&nbsp;{count === 1 ? 'item' : 'items'}</span>
    </span>
  )
}
export const TodoFilters = () => {
  const mode = useStore(taskTreeSelection.state.currentCase)
  const onAll = () => taskTreeSelection.api.all()
  const onActive = () => taskTreeSelection.api.active()
  const onCompleted = () => taskTreeSelection.api.completed()
  return (
    <ul data-filter-mode={mode}>
      <li>
        <a onClick={onAll} data-filter="all">
          All
        </a>
      </li>
      <span> </span>
      <li>
        <a onClick={onActive} data-filter="active">
          Active
        </a>
      </li>
      <li>
        <a onClick={onCompleted} data-filter="completed">
          Completed
        </a>
      </li>
    </ul>
  )
}

export const TodoItem = ({id, nesting}: {id: string; nesting: number}) => {
  const api = useItemApi(id, todoItemApi)
  const {title, completed, editing, titleEdited} = useItemState(id, todoItemApi)
  const visibleSubtasks = useComputedField(subtasksVisibleAmount, id)
  const totalSubtasks = useComputedField(subtasksTotalAmount, id)
  const onToggle = () => api.toggle()
  const onRemove = () => api.remove()
  const onAddChild = () => {
    addTodoFromDraft({childOf: id})
  }
  const onEdit = () => api.editMode('on')
  const onSave = () => api.save()
  const onConfirm = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') api.save()
    else if (e.key === 'Escape') api.editMode('off')
  }
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    api.onChange(e.target.value)
  }
  return (
    <>
      <li data-completed={completed || null} data-editing={editing || null}>
        <div className="view">
          <input
            className="toggle"
            type="checkbox"
            checked={completed}
            onChange={onToggle}
          />
          <label onDoubleClick={onEdit}>
            <span data-item-title>{title}</span>
            <span data-item-stats>
              {visibleSubtasks} subtasks out of {totalSubtasks} are shown
            </span>
          </label>
          <button type="button" onClick={onAddChild} data-item-button="+" />
          <button type="button" onClick={onRemove} data-item-button="×" />
        </div>
        <input
          className="edit"
          onBlur={onSave}
          onKeyDown={onConfirm}
          onChange={onChange}
          value={titleEdited}
        />
      </li>
      <TodoSubtree nesting={nesting + 1} id={id} />
    </>
  )
}
const TodoSubtree = ({nesting, id}: {nesting: number; id: string | null}) => (
  <ul className="todo-list" style={{'--nesting': nesting} as any}>
    {useGroup(subtaskGroups, id, (id) =>
      id === null ? <></> : <TodoItem id={id} nesting={nesting} />,
    )}
  </ul>
)
