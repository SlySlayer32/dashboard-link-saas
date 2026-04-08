'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { demoConversations, getWorkersByOrganization } from '@/lib/data/demo-data'
import { Header } from '@/components/dashboard/header'
import { ConversationList } from '@/components/messages/conversation-list'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Search, MessageSquarePlus, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function MessagesPage() {
  const { organization } = useAuth()
  const [search, setSearch] = useState('')
  const [newMessageOpen, setNewMessageOpen] = useState(false)
  const [workerSearch, setWorkerSearch] = useState('')

  const workers = organization ? getWorkersByOrganization(organization.id) : []
  
  const filteredConversations = demoConversations.filter(c =>
    c.workerName.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  )

  const filteredWorkers = workers.filter(w =>
    w.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
    w.phone.includes(workerSearch)
  )

  return (
    <>
      <Header title="Messages" />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Messages</h1>
              <p className="text-muted-foreground">
                Communicate with your workers via SMS
              </p>
            </div>
            <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
              <DialogTrigger asChild>
                <Button>
                  <MessageSquarePlus className="mr-2 h-4 w-4" />
                  New Message
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                  <DialogDescription>
                    Select a worker to send a message to
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search workers..."
                      value={workerSearch}
                      onChange={(e) => setWorkerSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {filteredWorkers.map((worker) => (
                      <Button
                        key={worker.id}
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                        onClick={() => setNewMessageOpen(false)}
                      >
                        <Link href={`/messages/${worker.id}`}>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                              {worker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="text-left">
                              <p className="font-medium">{worker.name}</p>
                              <p className="text-xs text-muted-foreground">{worker.phone}</p>
                            </div>
                          </div>
                        </Link>
                      </Button>
                    ))}
                    {filteredWorkers.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No workers found
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            {filteredConversations.length > 0 ? (
              <ConversationList conversations={filteredConversations} />
            ) : (
              <div className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No conversations found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start a new message to communicate with workers
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </>
  )
}
