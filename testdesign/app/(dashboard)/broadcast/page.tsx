'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { demoGroups, demoBroadcasts, getWorkersByOrganization } from '@/lib/data/demo-data'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Radio, Send, Clock, Check, AlertCircle, Users, History } from 'lucide-react'

export default function BroadcastPage() {
  const { organization } = useAuth()
  const [message, setMessage] = useState('')
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])

  const workers = organization ? getWorkersByOrganization(organization.id) : []
  const activeWorkers = workers.filter(w => w.status === 'active')

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const toggleWorker = (workerId: string) => {
    setSelectedWorkers(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    )
  }

  const toggleGroup = (groupId: string) => {
    const group = demoGroups.find(g => g.id === groupId)
    if (!group) return

    setSelectedGroups(prev => {
      if (prev.includes(groupId)) {
        // Remove group and its members
        setSelectedWorkers(workers => workers.filter(w => !group.memberIds.includes(w)))
        return prev.filter(id => id !== groupId)
      } else {
        // Add group and its members
        setSelectedWorkers(workers => [...new Set([...workers, ...group.memberIds])])
        return [...prev, groupId]
      }
    })
  }

  const selectAll = () => {
    setSelectedWorkers(activeWorkers.map(w => w.id))
  }

  const clearSelection = () => {
    setSelectedWorkers([])
    setSelectedGroups([])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-4 w-4 text-success" />
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-warning" />
      case 'draft':
        return <Clock className="h-4 w-4 text-muted-foreground" />
      default:
        return null
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <Header title="Broadcast Messages" />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Broadcast Messages</h1>
              <p className="text-muted-foreground">
                Send messages to multiple workers at once
              </p>
            </div>
          </div>

          <Tabs defaultValue="compose" className="w-full">
            <TabsList>
              <TabsTrigger value="compose" className="flex items-center gap-2">
                <Radio className="h-4 w-4" />
                Compose
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="mt-4">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recipients Selection */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Select Recipients</CardTitle>
                        <CardDescription>
                          {selectedWorkers.length} of {activeWorkers.length} workers selected
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={selectAll}>
                          Select All
                        </Button>
                        <Button variant="ghost" size="sm" onClick={clearSelection}>
                          Clear
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Groups */}
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Groups
                      </p>
                      <div className="space-y-2">
                        {demoGroups.slice(0, 4).map((group) => (
                          <label
                            key={group.id}
                            className="flex items-center gap-3 p-2 rounded-md border border-border hover:bg-muted/50 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedGroups.includes(group.id)}
                              onCheckedChange={() => toggleGroup(group.id)}
                            />
                            <div
                              className="h-4 w-4 rounded"
                              style={{ backgroundColor: group.color }}
                            />
                            <span className="flex-1">{group.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {group.memberCount}
                            </Badge>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Individual Workers */}
                    <div>
                      <p className="text-sm font-medium mb-2">Individual Workers</p>
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {activeWorkers.map((worker) => (
                          <label
                            key={worker.id}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedWorkers.includes(worker.id)}
                              onCheckedChange={() => toggleWorker(worker.id)}
                            />
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {getInitials(worker.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="flex-1 text-sm">{worker.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Message Composer */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Compose Message</CardTitle>
                    <CardDescription>
                      Write your broadcast message
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Type your broadcast message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        className="resize-none"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {message.length}/160 characters
                          {message.length > 160 && ` (${Math.ceil(message.length / 160)} SMS)`}
                        </span>
                      </div>

                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm font-medium mb-2">Preview</p>
                        <p className="text-sm text-muted-foreground">
                          {message || 'Your message will appear here...'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Will be sent to {selectedWorkers.length} recipients
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">
                          <Clock className="mr-2 h-4 w-4" />
                          Schedule
                        </Button>
                        <Button 
                          className="flex-1"
                          disabled={selectedWorkers.length === 0 || !message.trim()}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Broadcast History</CardTitle>
                  <CardDescription>
                    Previous broadcast messages and their delivery status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {demoBroadcasts.map((broadcast) => (
                      <div
                        key={broadcast.id}
                        className="flex items-start gap-4 p-4 rounded-lg border border-border"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-foreground mb-1">
                            {broadcast.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{formatDate(broadcast.sentAt)}</span>
                            <span>{broadcast.recipientCount} recipients</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(broadcast.status)}
                            <Badge variant="outline" className="capitalize">
                              {broadcast.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {broadcast.deliveredCount}/{broadcast.recipientCount} delivered
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
