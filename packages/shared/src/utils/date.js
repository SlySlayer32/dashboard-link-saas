/**
 * Get start and end of today in ISO format
 */
export function getTodayRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}
/**
 * Format date to friendly display
 */
export function formatDateTime(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
/**
 * Format time only
 */
export function formatTime(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
/**
 * Check if date is today
 */
export function isToday(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}
//# sourceMappingURL=date.js.map
