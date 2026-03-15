/**
 * ReadConfirmationIcon Component
 *
 * Shows a green checkmark if worker has opened their dashboard
 * Shows a gray icon if never opened
 */

import { CheckCircle2, Circle } from 'lucide-react'

interface ReadConfirmationIconProps {
  hasOpened: boolean
  className?: string
}

export function ReadConfirmationIcon({ hasOpened, className = '' }: ReadConfirmationIconProps) {
  if (hasOpened) {
    return (
      <CheckCircle2
        className={`w-5 h-5 text-green-600 ${className}`}
        aria-label='Dashboard opened'
      />
    )
  }

  return (
    <Circle className={`w-5 h-5 text-gray-400 ${className}`} aria-label='Dashboard not opened' />
  )
}
