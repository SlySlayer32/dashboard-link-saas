interface ErrorEvent {
  type: 'invalid_token' | 'expired_token' | 'not_found' | 'network_error';
  message: string;
  url: string;
  timestamp: string;
  userAgent?: string;
  errorCode?: string;
}

class ErrorTracking {
  private static instance: ErrorTracking;
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = import.meta.env.PROD;
  }

  static getInstance(): ErrorTracking {
    if (!ErrorTracking.instance) {
      ErrorTracking.instance = new ErrorTracking();
    }
    return ErrorTracking.instance;
  }

  trackError(event: ErrorEvent) {
    if (!this.isEnabled) return;

    // In a real implementation, this would send to an analytics service
    // For now, we'll log to console in development
    if (import.meta.env.DEV) {
      console.group('🔍 Error Tracking');
      console.log('Type:', event.type);
      console.log('Message:', event.message);
      console.log('URL:', event.url);
      console.log('Timestamp:', event.timestamp);
      if (event.errorCode) console.log('Error Code:', event.errorCode);
      console.groupEnd();
    }

    // Store in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('worker_errors') || '[]');
      errors.push({ ...event, id: Date.now() });
      // Keep only last 10 errors
      if (errors.length > 10) errors.shift();
      localStorage.setItem('worker_errors', JSON.stringify(errors));
    } catch {
      // Ignore localStorage errors
    }
  }

  getRecentErrors(): ErrorEvent[] {
    try {
      return JSON.parse(localStorage.getItem('worker_errors') || '[]');
    } catch {
      return [];
    }
  }

  clearErrors() {
    localStorage.removeItem('worker_errors');
  }
}

export const errorTracking = ErrorTracking.getInstance();
export type { ErrorEvent };
