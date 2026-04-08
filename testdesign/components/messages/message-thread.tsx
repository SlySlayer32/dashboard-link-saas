'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/lib/data/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react'

interface MessageThreadProps {
  messages: Message[]
  workerName: string
}

export function MessageThread({ messages, workerName }: MessageThreadProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom on new messages
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />
      case 'sent':
        return <Check className="h-3 w-3" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3" />
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-destructive" />
      default:
        return null
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, Message[]>)

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>No messages with {workerName}</p>
          <p className="text-sm mt-1">Send a message to start the conversation</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          <div className="flex justify-center mb-4">
            <Badge variant="secondary" className="text-xs font-normal">
              {date}
            </Badge>
          </div>
          <div className="space-y-3">
            {dateMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2',
                    message.direction === 'outbound'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div
                    className={cn(
                      'flex items-center justify-end gap-1 mt-1 text-xs',
                      message.direction === 'outbound'
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    )}
                  >
                    <span>{formatTime(message.timestamp)}</span>
                    {message.direction === 'outbound' && getStatusIcon(message.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
