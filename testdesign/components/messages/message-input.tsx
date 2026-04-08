'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { demoTemplates } from '@/lib/data/demo-data'
import { Send, FileText, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  recipientName?: string
}

const SMS_CHAR_LIMIT = 160
const SMS_EXTENDED_LIMIT = 1600

export function MessageInput({ onSend, disabled, recipientName }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)

  const charCount = message.length
  const smsCount = Math.ceil(charCount / SMS_CHAR_LIMIT) || 1

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTemplateSelect = (template: typeof demoTemplates[0]) => {
    let content = template.content
    // Replace variables with placeholder values
    if (recipientName) {
      content = content.replace('{{name}}', recipientName.split(' ')[0])
    }
    content = content.replace(/\{\{[^}]+\}\}/g, '[...]')
    setMessage(content)
    setShowTemplates(false)
  }

  return (
    <div className="border-t border-border p-4 bg-background">
      <div className="flex gap-2 mb-2">
        <Popover open={showTemplates} onOpenChange={setShowTemplates}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-3 border-b border-border">
              <p className="font-medium text-sm">Quick Reply Templates</p>
              <p className="text-xs text-muted-foreground">Click to insert a template</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {demoTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="w-full text-left p-3 hover:bg-muted/50 border-b border-border last:border-0"
                >
                  <p className="font-medium text-sm text-foreground">{template.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {template.content}
                  </p>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        <Button variant="outline" size="sm" disabled>
          <Clock className="h-4 w-4 mr-2" />
          Schedule
        </Button>
      </div>

      <div className="relative">
        <Textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={3}
          className="pr-24 resize-none"
          maxLength={SMS_EXTENDED_LIMIT}
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className={cn(
            'text-xs',
            charCount > SMS_CHAR_LIMIT ? 'text-warning' : 'text-muted-foreground'
          )}>
            {charCount}/{SMS_CHAR_LIMIT}
            {smsCount > 1 && ` (${smsCount} SMS)`}
          </span>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || disabled}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  )
}
