'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { demoWorkers, demoMessages } from '@/lib/data/demo-data'
import { Message } from '@/lib/data/types'
import { Header } from '@/components/dashboard/header'
import { MessageThread } from '@/components/messages/message-thread'
import { MessageInput } from '@/components/messages/message-input'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Phone, User } from 'lucide-react'

interface MessagePageProps {
  params: Promise<{ workerId: string }>
}

export default function MessagePage({ params }: MessagePageProps) {
  const router = useRouter()
  const { workerId } = use(params)
  
  const worker = demoWorkers.find(w => w.id === workerId)
  const initialMessages = demoMessages.filter(m => m.workerId === workerId)
  const [messages, setMessages] = useState<Message[]>(initialMessages)

  if (!worker) {
    return (
      <>
        <Header title="Conversation" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto text-center py-12">
            <p className="text-muted-foreground mb-4">Worker not found</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </main>
      </>
    )
  }

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

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      workerId: worker.id,
      content,
      direction: 'outbound',
      status: 'sent',
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, newMessage])

    // Simulate delivery after 1 second
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m =>
          m.id === newMessage.id ? { ...m, status: 'delivered' } : m
        )
      )
    }, 1000)
  }

  return (
    <>
      <Header title="Conversation" />
      <main className="flex-1 overflow-hidden p-6">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <Button variant="ghost" onClick={() => router.push('/messages')} className="self-start mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Button>

          <Card className="flex-1 flex flex-col overflow-hidden">
            {/* Conversation Header */}
            <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(worker.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-foreground">{worker.name}</h2>
                    <Badge variant="outline" className={getStatusColor(worker.status)}>
                      {worker.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {worker.phone}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/workers/${worker.id}`}>
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </Link>
              </Button>
            </div>

            {/* Message Thread */}
            <MessageThread messages={messages} workerName={worker.name} />

            {/* Message Input */}
            <MessageInput
              onSend={handleSendMessage}
              recipientName={worker.name}
            />
          </Card>
        </div>
      </main>
    </>
  )
}
