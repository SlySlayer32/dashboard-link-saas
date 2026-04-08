'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { getTodaysShifts, demoShifts, getWorkersByOrganization } from '@/lib/data/demo-data'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

export default function ShiftsPage() {
  const { organization } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const workers = organization ? getWorkersByOrganization(organization.id) : []
  const todaysShifts = organization ? getTodaysShifts(organization.id) : []

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success/10 text-success border-success/20'
      case 'in_progress':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'scheduled':
        return 'bg-muted text-muted-foreground border-border'
      case 'completed':
        return 'bg-muted text-foreground border-border'
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Generate week view dates
  const getWeekDates = () => {
    const start = new Date(selectedDate)
    start.setDate(start.getDate() - start.getDay() + 1) // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      return date
    })
  }

  const weekDates = getWeekDates()

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setSelectedDate(newDate)
  }

  return (
    <>
      <Header title="Shift Scheduling" />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Shift Scheduling</h1>
              <p className="text-muted-foreground">
                Create and manage worker shifts
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Shift
            </Button>
          </div>

          <Tabs defaultValue="week" className="w-full">
            <TabsList>
              <TabsTrigger value="today" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Today
              </TabsTrigger>
              <TabsTrigger value="week" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Week View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Today&apos;s Shifts</CardTitle>
                  <CardDescription>
                    {todaysShifts.length} shifts scheduled for today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {todaysShifts.length > 0 ? (
                    <div className="space-y-4">
                      {todaysShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(shift.workerName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{shift.workerName}</p>
                              <p className="text-sm text-muted-foreground">{shift.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-mono font-medium text-foreground">
                                {shift.startTime} - {shift.endTime}
                              </p>
                            </div>
                            <Badge variant="outline" className={getStatusColor(shift.status)}>
                              {shift.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No shifts scheduled for today
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="week" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Week View</CardTitle>
                      <CardDescription>
                        {weekDates[0].toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                        Today
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDates.map((date, index) => {
                      const dateStr = date.toISOString().split('T')[0]
                      const dayShifts = demoShifts.filter(s => s.date === dateStr)
                      const isToday = date.toDateString() === new Date().toDateString()

                      return (
                        <div
                          key={index}
                          className={`min-h-32 p-2 rounded-lg border ${
                            isToday ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <div className="text-center mb-2">
                            <p className="text-xs text-muted-foreground">{weekDays[index]}</p>
                            <p className={`text-lg font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                              {date.getDate()}
                            </p>
                          </div>
                          <div className="space-y-1">
                            {dayShifts.slice(0, 3).map((shift) => (
                              <div
                                key={shift.id}
                                className="text-xs p-1 rounded bg-primary/10 text-primary truncate"
                              >
                                {shift.startTime} {shift.workerName.split(' ')[0]}
                              </div>
                            ))}
                            {dayShifts.length > 3 && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{dayShifts.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Create Shift Dialog */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Shift</DialogTitle>
                <DialogDescription>
                  Assign a worker to a shift. They will receive an SMS notification.
                </DialogDescription>
              </DialogHeader>
              <form>
                <FieldGroup className="py-4">
                  <Field>
                    <FieldLabel>Worker</FieldLabel>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a worker" />
                      </SelectTrigger>
                      <SelectContent>
                        {workers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            {worker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Date</FieldLabel>
                    <Input type="date" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Start Time</FieldLabel>
                      <Input type="time" />
                    </Field>
                    <Field>
                      <FieldLabel>End Time</FieldLabel>
                      <Input type="time" />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>Location</FieldLabel>
                    <Input placeholder="Enter work location" />
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Shift</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </>
  )
}
