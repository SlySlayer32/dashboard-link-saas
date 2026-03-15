/**
 * LastOpenedBadge Component
 *
 * Displays when a worker last opened their dashboard
 * Shows relative time (e.g., "Opened 2 hours ago")
 */

import { formatDistanceToNow } from 'date-fns'

interface LastOpenedBadgeProps {
  lastAccessedAt: string | null
  className?: string
}

export function LastOpenedBadge({ lastAccessedAt, className = '' }: LastOpenedBadgeProps) {
  if (!lastAccessedAt) {
    return <span className={`text-sm text-gray-500 ${className}`}>Never opened</span>
  }

  const timeAgo = formatDistanceToNow(new Date(lastAccessedAt), { addSuffix: true })

  return <span className={`text-sm text-gray-700 ${className}`}>Opened {timeAgo}</span>
}
