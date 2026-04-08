// Core entity types for the communication platform

export interface Organization {
  id: string
  name: string
  industry: 'cleaning' | 'hospital' | 'transport' | 'other'
  logo?: string
  timezone: string
  enabledPlugins: PluginId[]
}

export interface Admin {
  id: string
  email: string
  name: string
  organizationId: string
  role: 'owner' | 'admin' | 'manager'
  avatar?: string
}

export interface Worker {
  id: string
  name: string
  phone: string
  email?: string
  groups: string[]
  status: 'active' | 'inactive' | 'on_leave'
  hireDate: string
  avatar?: string
  organizationId: string
  notes?: string
}

export interface Message {
  id: string
  workerId: string
  content: string
  direction: 'inbound' | 'outbound'
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'received'
  timestamp: string
  templateId?: string
  broadcastId?: string
}

export interface Conversation {
  workerId: string
  workerName: string
  workerPhone: string
  workerAvatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  status: 'active' | 'archived'
}

export interface Shift {
  id: string
  workerId: string
  workerName: string
  date: string
  startTime: string
  endTime: string
  location?: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
}

export interface Task {
  id: string
  title: string
  description: string
  assignedTo: string
  assignedToName: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  createdAt: string
}

export interface WorkerGroup {
  id: string
  name: string
  description?: string
  color: string
  memberCount: number
  memberIds: string[]
}

export interface MessageTemplate {
  id: string
  name: string
  content: string
  category: string
  variables: string[]
  usageCount: number
}

export interface Broadcast {
  id: string
  message: string
  recipientCount: number
  sentAt: string
  status: 'draft' | 'scheduled' | 'sent' | 'partial'
  deliveredCount: number
  failedCount: number
}

// Plugin system types
export type PluginId = 
  | 'shifts'
  | 'templates'
  | 'analytics'
  | 'groups'
  | 'broadcast'
  | 'tasks'
  | 'checkin'
  | 'emergency'

export interface Plugin {
  id: PluginId
  name: string
  description: string
  icon: string
  href: string
  enabled: boolean
  category: 'communication' | 'scheduling' | 'management' | 'reporting'
}

// Analytics types
export interface DailyStats {
  date: string
  messagesSent: number
  messagesReceived: number
  responseRate: number
}

export interface OverviewStats {
  totalWorkers: number
  activeWorkers: number
  messagesToday: number
  messagesThisWeek: number
  pendingTasks: number
  shiftsToday: number
  responseRate: number
  unreadMessages: number
}

// Workspace customization types
export type IndustryType = 
  | 'cleaning' 
  | 'healthcare' 
  | 'transport' 
  | 'hospitality' 
  | 'security' 
  | 'retail' 
  | 'construction' 
  | 'education' 
  | 'other'

export type FontFamily = 'inter' | 'system' | 'roboto' | 'poppins'
export type BorderRadius = 'none' | 'small' | 'medium' | 'large'

export interface WorkspaceTheme {
  primaryColor: string
  backgroundColor: string
  sidebarColor: string
  textColor: string
  fontFamily: FontFamily
  borderRadius: BorderRadius
}

export interface WorkspaceBranding {
  logo?: string
  appName: string
  tagline?: string
}

export interface WorkspaceTerminology {
  worker: string
  workers: string
  shift: string
  shifts: string
  task: string
  tasks: string
  group: string
  groups: string
  message: string
  messages: string
}

export interface PluginCustomization {
  pluginId: PluginId
  enabled: boolean
  customName?: string
  customDescription?: string
}

export interface DashboardWidget {
  id: string
  type: 'stats' | 'activity' | 'shifts-today' | 'quick-actions' | 'tasks' | 'messages' | 'plugin-card'
  pluginId?: PluginId
  position: { x: number; y: number; w: number; h: number }
}

export interface DashboardLayout {
  widgets: DashboardWidget[]
  columns: 12
}

export interface WorkspaceSettings {
  theme: WorkspaceTheme
  branding: WorkspaceBranding
  terminology: WorkspaceTerminology
  plugins: PluginCustomization[]
  dashboardLayout: DashboardLayout
  onboardingCompleted: boolean
}
