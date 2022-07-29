import {render, screen} from '@testing-library/react'
import React from 'react'

import {TodoApp} from './todo-app'

test('renders app', () => {
  render(<TodoApp />)
  const linkElement = screen.getByText('TodoApp')
  expect(linkElement).toBeInTheDocument()
})
