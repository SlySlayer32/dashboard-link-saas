/**
 * Internationalization structure for Zapier-style admin interface
 * Ready for translations without active translation work
 */

export type TranslationKey = 
  // Authentication
  | 'auth.login.title'
  | 'auth.login.subtitle'
  | 'auth.login.email'
  | 'auth.login.password'
  | 'auth.login.forgotPassword'
  | 'auth.login.signIn'
  | 'auth.login.noAccount'
  | 'auth.login.signUp'
  | 'auth.signup.title'
  | 'auth.signup.subtitle'
  | 'auth.signup.organization'
  | 'auth.signup.email'
  | 'auth.signup.password'
  | 'auth.signup.confirmPassword'
  | 'auth.signup.terms'
  | 'auth.signup.createAccount'
  | 'auth.signup.hasAccount'
  | 'auth.signup.signIn'
  
  // Dashboard
  | 'dashboard.title'
  | 'dashboard.subtitle'
  | 'dashboard.welcome'
  | 'dashboard.recentActivity'
  | 'dashboard.quickActions'
  | 'dashboard.stats'
  
  // Common UI
  | 'common.loading'
  | 'common.error'
  | 'common.success'
  | 'common.warning'
  | 'common.info'
  | 'common.cancel'
  | 'common.save'
  | 'common.delete'
  | 'common.edit'
  | 'common.add'
  | 'common.search'
  | 'common.filter'
  | 'common.sort'
  | 'common.next'
  | 'common.previous'
  | 'common.close'
  | 'common.confirm'
  | 'common.back'
  
  // Mobile Dashboard
  | 'mobile.dashboard.title'
  | 'mobile.schedule.title'
  | 'mobile.tasks.title'
  | 'mobile.refresh'
  | 'mobile.noData'
  | 'mobile.offline'
  
  // Forms
  | 'form.required'
  | 'form.optional'
  | 'form.invalidEmail'
  | 'form.passwordTooShort'
  | 'form.passwordMismatch'
  | 'form.fieldRequired'

export interface TranslationNamespace {
  auth: {
    login: {
      title: string
      subtitle: string
      email: string
      password: string
      forgotPassword: string
      signIn: string
      noAccount: string
      signUp: string
    }
    signup: {
      title: string
      subtitle: string
      organization: string
      email: string
      password: string
      confirmPassword: string
      terms: string
      createAccount: string
      hasAccount: string
      signIn: string
    }
  }
  dashboard: {
    title: string
    subtitle: string
    welcome: string
    recentActivity: string
    quickActions: string
    stats: string
  }
  common: {
    loading: string
    error: string
    success: string
    warning: string
    info: string
    cancel: string
    save: string
    delete: string
    edit: string
    add: string
    search: string
    filter: string
    sort: string
    next: string
    previous: string
    close: string
    confirm: string
    back: string
  }
  mobile: {
    dashboard: {
      title: string
    }
    schedule: {
      title: string
    }
    tasks: {
      title: string
    }
    refresh: string
    noData: string
    offline: string
  }
  form: {
    required: string
    optional: string
    invalidEmail: string
    passwordTooShort: string
    passwordMismatch: string
    fieldRequired: string
  }
}

// Default English translations (structure-ready)
export const defaultTranslations: TranslationNamespace = {
  auth: {
    login: {
      title: 'Welcome back',
      subtitle: 'Sign in to your Dashboard Link account',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot password?',
      signIn: 'Sign in',
      noAccount: "Need an account?",
      signUp: 'Sign up',
    },
    signup: {
      title: 'Create your account',
      subtitle: 'Get started with Dashboard Link',
      organization: 'Organization name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      terms: 'I agree to the Terms of Service and Privacy Policy',
      createAccount: 'Create account',
      hasAccount: 'Already have an account?',
      signIn: 'Sign in',
    },
  },
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Manage your workflows and integrations',
    welcome: 'Welcome back',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    stats: 'Statistics',
  },
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    confirm: 'Confirm',
    back: 'Back',
  },
  mobile: {
    dashboard: {
      title: 'Dashboard',
    },
    schedule: {
      title: 'Schedule',
    },
    tasks: {
      title: 'Tasks',
    },
    refresh: 'Pull to refresh',
    noData: 'No data available',
    offline: 'Offline',
  },
  form: {
    required: 'Required',
    optional: 'Optional',
    invalidEmail: 'Invalid email address',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordMismatch: 'Passwords do not match',
    fieldRequired: 'This field is required',
  },
}

// Translation hook structure (ready for implementation)
export interface UseTranslationReturn {
  t: (key: TranslationKey) => string
  locale: string
  setLocale: (locale: string) => void
  isRTL: boolean
}

// Placeholder hook (ready for i18n library integration)
export const useTranslation = (): UseTranslationReturn => {
  // This will be implemented with an i18n library like react-i18next
  // For now, returns English translations
  const t = (key: TranslationKey): string => {
    const keys = key.split('.')
    let value: any = defaultTranslations
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key
  }
  
  return {
    t,
    locale: 'en',
    setLocale: () => {},
    isRTL: false,
  }
}

// Supported locales (structure-ready)
export const supportedLocales = [
  'en', // English (default)
  'es', // Spanish
  'fr', // French
  'de', // German
  'ja', // Japanese
  'zh', // Chinese
] as const

export type SupportedLocale = typeof supportedLocales[number]
