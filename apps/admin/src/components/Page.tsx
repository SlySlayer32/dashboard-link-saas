import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

interface Todo {
  id: string;
  text: string;
  created_at: string;
}

function Page() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getTodos() {
      try {
        const { data: todos, error } = await supabase
          .from('todos')
          .select('*')

        if (error) {
          console.error('Error fetching todos:', error)
          return
        }

        if (todos && todos.length > 0) {
          setTodos(todos)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    getTodos()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Todos</h1>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  )
}

export default Page
