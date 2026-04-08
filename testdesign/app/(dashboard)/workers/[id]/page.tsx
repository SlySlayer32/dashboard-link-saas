'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { demoWorkers, demoMessages, demoShifts, demoTasks, demoGroups } from '@/lib/data/demo-data'
import { Header } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  CheckSquare,
  Edit,
  Send,
} from 'lucide-react'

interface WorkerProfilePageProps {
  params: Promise<{ id: string }>
}

export default function WorkerProfilePage({ params }: WorkerProfilePageProps) {
  const router = useRouter()
  const { id } = use(params)
  
  const worker = demoWorkers.find(w => w.id === id)
  
  if (!worker) {
    return (
      <>
        <Header title="Worker Not Found" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto text-center py-12">
            <p className="text-muted-foreground mb-4">Worker not found</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </main>
      </>
    )
  }

  const workerMessages = demoMessages.filter(m => m.workerId === worker.id)
  const workerShifts = demoShifts.filter(s => s.workerId === worker.id)
  const workerTasks = demoTasks.filter(t => t.assignedTo === worker.id)
  const workerGroups = demoGroups.filter(g => worker.groups.includes(g.id))

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/20'
      case 'inactive':
        return 'bg-muted text-muted-foreground border-border'
      case 'on_leave':
        return 'bg-warning/10 text-warning border-warning/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <Header title="Worker Profile" />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workers
          </Button>

          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {getInitials(worker.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">{worker.name}</h1>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {worker.phone}
                        </span>
                        {worker.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {worker.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button asChild>
                        <Link href={`/messages/${worker.id}`}>
                          <Send className="mr-2 h-4 w-4" />
                          Message
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Badge variant="outline" className={getStatusColor(worker.status)}>
                      {worker.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Hired {formatDate(worker.hireDate)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Groups */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {workerGroups.length > 0 ? (
                  workerGroups.map((group) => (
                    <Badge
                      key={group.id}
                      variant="secondary"
                      style={{ borderLeftColor: group.color, borderLeftWidth: 3 }}
                    >
                      {group.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No groups assigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Tabs */}
          <Tabs defaultValue="messages" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages ({workerMessages.length})
              </TabsTrigger>
              <TabsTrigger value="shifts" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Shifts ({workerShifts.length})
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tasks ({workerTasks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Message History</CardTitle>
                  <CardDescription>Recent SMS conversations</CardDescription>
                </CardHeader>
                <CardContent>
                  {workerMessages.length > 0 ? (
                    <div className="space-y-4">
                      {workerMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              message.direction === 'outbound'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.direction === 'outbound'
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No messages yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shifts" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Shift History</CardTitle>
                  <CardDescription>Scheduled and completed shifts</CardDescription>
                </CardHeader>
                <CardContent>
                  {workerShifts.length > 0 ? (
                    <div className="space-y-3">
                      {workerShifts.map((shift) => (
                        <div key={shift.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div>
                            <p className="font-medium text-foreground">{formatDate(shift.date)}</p>
                            <p className="text-sm text-muted-foreground">{shift.location}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm">{shift.startTime} - {shift.endTime}</p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {shift.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No shifts scheduled
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assigned Tasks</CardTitle>
                  <CardDescription>Current and completed tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  {workerTasks.length > 0 ? (
                    <div className="space-y-3">
                      {workerTasks.map((task) => (
                        <div key={task.id} className="flex items-start justify-between py-2 border-b border-border last:border-0">
                          <div>
                            <p className="font-medium text-foreground">{task.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant={task.status === 'done' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {task.status.replace('_', ' ')}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                task.priority === 'high'
                                  ? 'border-destructive text-destructive'
                                  : task.priority === 'medium'
                                  ? 'border-warning text-warning'
                                  : ''
                              }
                            >
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No tasks assigned
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
