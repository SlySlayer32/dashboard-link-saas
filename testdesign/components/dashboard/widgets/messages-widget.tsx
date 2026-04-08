'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { useTerminology } from '@/lib/workspace/workspace-context'
import { getConversations } from '@/lib/data/demo-data'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export function MessagesWidget() {
  const { organization } = useAuth()
  const { t } = useTerminology()
  const conversations = getConversations(organization?.id || '')

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Recent {t('messages', true)}</h3>
        <Link 
          href="/messages" 
          className="text-xs text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="flex-1 overflow-auto">
        {conversations.slice(0, 5).map((conversation) => (
          <Link
            key={conversation.workerId}
            href={`/messages/${conversation.workerId}`}
            className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors border-b last:border-b-0"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={conversation.workerAvatar} />
              <AvatarFallback>
                {conversation.workerName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate">
                  {conversation.workerName}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {conversation.lastMessage}
              </p>
            </div>
            {conversation.unreadCount > 0 && (
              <span className="flex-shrink-0 h-5 min-w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {conversation.unreadCount}
              </span>
            )}
          </Link>
        ))}
        {conversations.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No {t('messages')} yet
          </p>
        )}
      </div>
    </div>
  )
}
