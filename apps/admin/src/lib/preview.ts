export const ADMIN_PREVIEW_MODE_KEY = 'admin-preview-mode'

export function isPreviewMode(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return localStorage.getItem(ADMIN_PREVIEW_MODE_KEY) === 'true'
}

export function setPreviewMode(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return
  }

  if (enabled) {
    localStorage.setItem(ADMIN_PREVIEW_MODE_KEY, 'true')
    return
  }

  localStorage.removeItem(ADMIN_PREVIEW_MODE_KEY)
}
