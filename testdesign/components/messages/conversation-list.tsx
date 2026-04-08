'use client'

import Link from 'next/link'
import { Conversation } from '@/lib/data/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ConversationListProps {
  conversations: Conversation[]
  selectedId?: string
}

export function ConversationList({ conversations, selectedId }: ConversationListProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-AU', { weekday: 'short' })
    }
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No conversations yet</p>
        <p className="text-sm mt-1">Start messaging your workers</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conversation) => (
        <Link
          key={conversation.workerId}
          href={`/messages/${conversation.workerId}`}
          className={cn(
            'flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors',
            selectedId === conversation.workerId && 'bg-muted'
          )}
        >
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(conversation.workerName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-foreground truncate">
                {conversation.workerName}
              </p>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatTime(conversation.lastMessageTime)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {conversation.lastMessage}
            </p>
          </div>
          {conversation.unreadCount > 0 && (
            <Badge className="shrink-0 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
              {conversation.unreadCount}
            </Badge>
          )}
        </Link>
      ))}
    </div>
  )
}
