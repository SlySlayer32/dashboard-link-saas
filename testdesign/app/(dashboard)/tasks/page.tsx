'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { getTasksByOrganization, getWorkersByOrganization } from '@/lib/data/demo-data'
import { Task } from '@/lib/data/types'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Plus, CheckSquare, Clock, Calendar, GripVertical } from 'lucide-react'

type TaskStatus = 'todo' | 'in_progress' | 'done'

export default function TasksPage() {
  const { organization } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  
  const tasks = organization ? getTasksByOrganization(organization.id) : []
  const workers = organization ? getWorkersByOrganization(organization.id) : []

  const columns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: 'border-muted-foreground/20' },
    { id: 'in_progress', title: 'In Progress', color: 'border-primary' },
    { id: 'done', title: 'Done', color: 'border-success' },
  ]

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20'
      case 'low':
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <>
      <Header title="Task Management" />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Task Management</h1>
              <p className="text-muted-foreground">
                Assign and track tasks with your workers
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </div>

          {/* Kanban Board */}
          <div className="grid gap-4 lg:grid-cols-3">
            {columns.map((column) => {
              const columnTasks = getTasksByStatus(column.id)
              
              return (
                <Card key={column.id} className={`border-t-4 ${column.color}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{column.title}</CardTitle>
                      <Badge variant="secondary">{columnTasks.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 min-h-64">
                      {columnTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 opacity-50" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground line-clamp-2">
                                {task.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {getInitials(task.assignedToName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {task.assignedToName.split(' ')[0]}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {task.dueDate && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                              <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {columnTasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                          <CheckSquare className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-sm">No tasks</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Task Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Task Summary</CardTitle>
              <CardDescription>Overview of all assigned tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Pending</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {tasks.filter(t => t.status === 'todo').length}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <CheckSquare className="h-4 w-4" />
                    <span className="text-sm">In Progress</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {tasks.filter(t => t.status === 'in_progress').length}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-success/5">
                  <div className="flex items-center gap-2 text-success mb-1">
                    <CheckSquare className="h-4 w-4" />
                    <span className="text-sm">Completed</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {tasks.filter(t => t.status === 'done').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create Task Dialog */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Assign a task to a worker. They will receive an SMS notification.
                </DialogDescription>
              </DialogHeader>
              <form>
                <FieldGroup className="py-4">
                  <Field>
                    <FieldLabel>Task Title</FieldLabel>
                    <Input placeholder="e.g., Clean conference room" />
                  </Field>
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea placeholder="Task details..." rows={3} />
                  </Field>
                  <Field>
                    <FieldLabel>Assign To</FieldLabel>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a worker" />
                      </SelectTrigger>
                      <SelectContent>
                        {workers.filter(w => w.status === 'active').map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            {worker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Priority</FieldLabel>
                      <Select defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Due Date</FieldLabel>
                      <Input type="date" />
                    </Field>
                  </div>
                </FieldGroup>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Task</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </>
  )
}
