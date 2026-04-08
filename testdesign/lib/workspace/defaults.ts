import type { 
  IndustryType, 
  WorkspaceSettings, 
  WorkspaceTerminology, 
  WorkspaceTheme,
  DashboardLayout,
  PluginCustomization,
  PluginId
} from '@/lib/data/types'

// Industry-specific terminology presets
export const industryTerminology: Record<IndustryType, WorkspaceTerminology> = {
  cleaning: {
    worker: 'Cleaner',
    workers: 'Cleaners',
    shift: 'Roster',
    shifts: 'Rosters',
    task: 'Job',
    tasks: 'Jobs',
    group: 'Team',
    groups: 'Teams',
    message: 'Message',
    messages: 'Messages',
  },
  healthcare: {
    worker: 'Staff Member',
    workers: 'Staff',
    shift: 'Shift',
    shifts: 'Shifts',
    task: 'Duty',
    tasks: 'Duties',
    group: 'Ward',
    groups: 'Wards',
    message: 'Message',
    messages: 'Messages',
  },
  transport: {
    worker: 'Driver',
    workers: 'Drivers',
    shift: 'Route',
    shifts: 'Routes',
    task: 'Delivery',
    tasks: 'Deliveries',
    group: 'Fleet',
    groups: 'Fleets',
    message: 'Message',
    messages: 'Messages',
  },
  hospitality: {
    worker: 'Team Member',
    workers: 'Team Members',
    shift: 'Shift',
    shifts: 'Shifts',
    task: 'Task',
    tasks: 'Tasks',
    group: 'Department',
    groups: 'Departments',
    message: 'Message',
    messages: 'Messages',
  },
  security: {
    worker: 'Officer',
    workers: 'Officers',
    shift: 'Post',
    shifts: 'Posts',
    task: 'Patrol',
    tasks: 'Patrols',
    group: 'Unit',
    groups: 'Units',
    message: 'Alert',
    messages: 'Alerts',
  },
  retail: {
    worker: 'Associate',
    workers: 'Associates',
    shift: 'Schedule',
    shifts: 'Schedules',
    task: 'Task',
    tasks: 'Tasks',
    group: 'Department',
    groups: 'Departments',
    message: 'Message',
    messages: 'Messages',
  },
  construction: {
    worker: 'Crew Member',
    workers: 'Crew',
    shift: 'Schedule',
    shifts: 'Schedules',
    task: 'Job',
    tasks: 'Jobs',
    group: 'Site',
    groups: 'Sites',
    message: 'Message',
    messages: 'Messages',
  },
  education: {
    worker: 'Staff Member',
    workers: 'Staff',
    shift: 'Timetable',
    shifts: 'Timetables',
    task: 'Assignment',
    tasks: 'Assignments',
    group: 'Department',
    groups: 'Departments',
    message: 'Notice',
    messages: 'Notices',
  },
  other: {
    worker: 'Worker',
    workers: 'Workers',
    shift: 'Shift',
    shifts: 'Shifts',
    task: 'Task',
    tasks: 'Tasks',
    group: 'Group',
    groups: 'Groups',
    message: 'Message',
    messages: 'Messages',
  },
}

// Industry display names and descriptions
export const industryInfo: Record<IndustryType, { name: string; description: string; icon: string }> = {
  cleaning: {
    name: 'Cleaning Services',
    description: 'Commercial and residential cleaning companies',
    icon: 'Sparkles',
  },
  healthcare: {
    name: 'Healthcare',
    description: 'Hospitals, clinics, aged care facilities',
    icon: 'Heart',
  },
  transport: {
    name: 'Transport & Logistics',
    description: 'Delivery services, trucking, courier companies',
    icon: 'Truck',
  },
  hospitality: {
    name: 'Hospitality',
    description: 'Hotels, restaurants, event venues',
    icon: 'UtensilsCrossed',
  },
  security: {
    name: 'Security Services',
    description: 'Security guards, patrol services',
    icon: 'Shield',
  },
  retail: {
    name: 'Retail',
    description: 'Stores, shopping centers, warehouses',
    icon: 'ShoppingBag',
  },
  construction: {
    name: 'Construction',
    description: 'Building sites, contractors, trades',
    icon: 'HardHat',
  },
  education: {
    name: 'Education',
    description: 'Schools, universities, training centers',
    icon: 'GraduationCap',
  },
  other: {
    name: 'Other Industry',
    description: 'Custom setup for any other business type',
    icon: 'Building2',
  },
}

// Default theme
export const defaultTheme: WorkspaceTheme = {
  primaryColor: '#6366f1', // Indigo
  backgroundColor: '#0f1117',
  sidebarColor: '#0a0b0f',
  textColor: '#f0f0f0',
  fontFamily: 'inter',
  borderRadius: 'medium',
}

// Industry-specific color suggestions
export const industryColors: Record<IndustryType, string> = {
  cleaning: '#06b6d4', // Cyan
  healthcare: '#ec4899', // Pink
  transport: '#f59e0b', // Amber
  hospitality: '#8b5cf6', // Violet
  security: '#3b82f6', // Blue
  retail: '#10b981', // Emerald
  construction: '#f97316', // Orange
  education: '#6366f1', // Indigo
  other: '#6366f1', // Indigo
}

// Default dashboard layout
export const defaultDashboardLayout: DashboardLayout = {
  columns: 12,
  widgets: [
    { id: 'stats', type: 'stats', position: { x: 0, y: 0, w: 12, h: 2 } },
    { id: 'activity', type: 'activity', position: { x: 0, y: 2, w: 4, h: 4 } },
    { id: 'shifts-today', type: 'shifts-today', position: { x: 4, y: 2, w: 4, h: 4 } },
    { id: 'tasks', type: 'tasks', position: { x: 8, y: 2, w: 4, h: 4 } },
    { id: 'messages', type: 'messages', position: { x: 0, y: 6, w: 6, h: 4 } },
    { id: 'quick-actions', type: 'quick-actions', position: { x: 6, y: 6, w: 6, h: 4 } },
  ],
}

// Default plugin customizations
export const defaultPlugins: PluginCustomization[] = [
  { pluginId: 'shifts', enabled: true },
  { pluginId: 'templates', enabled: true },
  { pluginId: 'analytics', enabled: true },
  { pluginId: 'groups', enabled: true },
  { pluginId: 'broadcast', enabled: true },
  { pluginId: 'tasks', enabled: true },
  { pluginId: 'checkin', enabled: false },
  { pluginId: 'emergency', enabled: false },
]

// Plugin base info for customization
export const pluginBaseInfo: Record<PluginId, { defaultName: string; defaultDescription: string; icon: string; href: string }> = {
  shifts: {
    defaultName: 'Shift Scheduling',
    defaultDescription: 'Schedule and manage worker shifts',
    icon: 'Calendar',
    href: '/shifts',
  },
  templates: {
    defaultName: 'Quick Replies',
    defaultDescription: 'Pre-written message templates',
    icon: 'FileText',
    href: '/templates',
  },
  analytics: {
    defaultName: 'Analytics',
    defaultDescription: 'Reports and insights',
    icon: 'BarChart3',
    href: '/analytics',
  },
  groups: {
    defaultName: 'Worker Groups',
    defaultDescription: 'Organize workers into teams',
    icon: 'Users',
    href: '/groups',
  },
  broadcast: {
    defaultName: 'Broadcast',
    defaultDescription: 'Send bulk messages',
    icon: 'Radio',
    href: '/broadcast',
  },
  tasks: {
    defaultName: 'Task Management',
    defaultDescription: 'Assign and track tasks',
    icon: 'CheckSquare',
    href: '/tasks',
  },
  checkin: {
    defaultName: 'Check-In/Out',
    defaultDescription: 'Track worker attendance',
    icon: 'Clock',
    href: '/checkin',
  },
  emergency: {
    defaultName: 'Emergency Alerts',
    defaultDescription: 'Send urgent broadcasts',
    icon: 'AlertTriangle',
    href: '/emergency',
  },
}

// Create default workspace settings for a given industry
export function createDefaultWorkspaceSettings(industry: IndustryType = 'other'): WorkspaceSettings {
  return {
    theme: {
      ...defaultTheme,
      primaryColor: industryColors[industry],
    },
    branding: {
      appName: 'ConnectHub',
      tagline: 'Your team, connected',
    },
    terminology: industryTerminology[industry],
    plugins: defaultPlugins.map(p => ({ ...p })),
    dashboardLayout: {
      ...defaultDashboardLayout,
      widgets: defaultDashboardLayout.widgets.map(w => ({ ...w, position: { ...w.position } })),
    },
    onboardingCompleted: false,
  }
}
