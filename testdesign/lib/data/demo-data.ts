import type {
  Organization,
  Admin,
  Worker,
  Message,
  Conversation,
  Shift,
  Task,
  WorkerGroup,
  MessageTemplate,
  Broadcast,
  DailyStats,
  OverviewStats,
} from './types'

// Demo Organizations
export const demoOrganizations: Organization[] = [
  {
    id: 'org-cleaning',
    name: 'CleanPro Services',
    industry: 'cleaning',
    timezone: 'Australia/Sydney',
    enabledPlugins: ['shifts', 'templates', 'analytics', 'groups', 'broadcast', 'tasks'],
  },
  {
    id: 'org-hospital',
    name: 'Metro General Hospital',
    industry: 'hospital',
    timezone: 'Australia/Sydney',
    enabledPlugins: ['shifts', 'templates', 'analytics', 'groups', 'broadcast', 'tasks', 'emergency'],
  },
  {
    id: 'org-transport',
    name: 'Swift Logistics',
    industry: 'transport',
    timezone: 'Australia/Sydney',
    enabledPlugins: ['shifts', 'templates', 'analytics', 'groups', 'broadcast', 'tasks', 'checkin'],
  },
]

// Demo Admin Accounts
export const demoAdmins: Admin[] = [
  {
    id: 'admin-1',
    email: 'admin@cleaning.demo',
    name: 'Sarah Mitchell',
    organizationId: 'org-cleaning',
    role: 'owner',
  },
  {
    id: 'admin-2',
    email: 'admin@hospital.demo',
    name: 'Dr. James Chen',
    organizationId: 'org-hospital',
    role: 'owner',
  },
  {
    id: 'admin-3',
    email: 'admin@transport.demo',
    name: 'Michael Torres',
    organizationId: 'org-transport',
    role: 'owner',
  },
]

// Demo Workers (15 workers)
export const demoWorkers: Worker[] = [
  {
    id: 'worker-1',
    name: 'Emma Johnson',
    phone: '+61412345001',
    email: 'emma.j@email.com',
    groups: ['group-morning', 'group-cbd'],
    status: 'active',
    hireDate: '2023-03-15',
    organizationId: 'org-cleaning',
  },
  {
    id: 'worker-2',
    name: 'Liam Williams',
    phone: '+61412345002',
    groups: ['group-afternoon', 'group-cbd'],
    status: 'active',
    hireDate: '2023-05-20',
    organizationId: 'org-cleaning',
  },
  {
    id: 'worker-3',
    name: 'Olivia Brown',
    phone: '+61412345003',
    email: 'olivia.b@email.com',
    groups: ['group-morning', 'group-suburbs'],
    status: 'active',
    hireDate: '2022-11-10',
    organizationId: 'org-cleaning',
  },
  {
    id: 'worker-4',
    name: 'Noah Davis',
    phone: '+61412345004',
    groups: ['group-night'],
    status: 'on_leave',
    hireDate: '2023-01-08',
    organizationId: 'org-cleaning',
  },
  {
    id: 'worker-5',
    name: 'Ava Martinez',
    phone: '+61412345005',
    email: 'ava.m@email.com',
    groups: ['group-morning', 'group-cbd'],
    status: 'active',
    hireDate: '2023-07-22',
    organizationId: 'org-cleaning',
  },
  {
    id: 'worker-6',
    name: 'Sophia Garcia',
    phone: '+61412345006',
    groups: ['group-nurses', 'group-day'],
    status: 'active',
    hireDate: '2022-09-01',
    organizationId: 'org-hospital',
  },
  {
    id: 'worker-7',
    name: 'Jackson Lee',
    phone: '+61412345007',
    email: 'jackson.l@hospital.com',
    groups: ['group-nurses', 'group-night'],
    status: 'active',
    hireDate: '2023-02-14',
    organizationId: 'org-hospital',
  },
  {
    id: 'worker-8',
    name: 'Isabella Kim',
    phone: '+61412345008',
    groups: ['group-orderlies', 'group-day'],
    status: 'active',
    hireDate: '2023-04-30',
    organizationId: 'org-hospital',
  },
  {
    id: 'worker-9',
    name: 'Lucas Anderson',
    phone: '+61412345009',
    groups: ['group-nurses', 'group-day'],
    status: 'inactive',
    hireDate: '2022-06-18',
    organizationId: 'org-hospital',
  },
  {
    id: 'worker-10',
    name: 'Mia Thompson',
    phone: '+61412345010',
    email: 'mia.t@hospital.com',
    groups: ['group-admin-staff'],
    status: 'active',
    hireDate: '2023-08-05',
    organizationId: 'org-hospital',
  },
  {
    id: 'worker-11',
    name: 'Ethan White',
    phone: '+61412345011',
    groups: ['group-drivers', 'group-metro'],
    status: 'active',
    hireDate: '2022-12-03',
    organizationId: 'org-transport',
  },
  {
    id: 'worker-12',
    name: 'Charlotte Harris',
    phone: '+61412345012',
    email: 'charlotte.h@swift.com',
    groups: ['group-drivers', 'group-regional'],
    status: 'active',
    hireDate: '2023-03-28',
    organizationId: 'org-transport',
  },
  {
    id: 'worker-13',
    name: 'Aiden Clark',
    phone: '+61412345013',
    groups: ['group-warehouse'],
    status: 'active',
    hireDate: '2023-06-12',
    organizationId: 'org-transport',
  },
  {
    id: 'worker-14',
    name: 'Amelia Lewis',
    phone: '+61412345014',
    groups: ['group-drivers', 'group-metro'],
    status: 'on_leave',
    hireDate: '2022-10-25',
    organizationId: 'org-transport',
  },
  {
    id: 'worker-15',
    name: 'Benjamin Walker',
    phone: '+61412345015',
    email: 'ben.w@swift.com',
    groups: ['group-dispatch'],
    status: 'active',
    hireDate: '2023-09-01',
    organizationId: 'org-transport',
  },
]

// Demo Messages
export const demoMessages: Message[] = [
  {
    id: 'msg-1',
    workerId: 'worker-1',
    content: 'Hi Emma, your shift tomorrow starts at 8am at 123 Collins St. Please confirm.',
    direction: 'outbound',
    status: 'delivered',
    timestamp: '2024-01-15T09:30:00Z',
  },
  {
    id: 'msg-2',
    workerId: 'worker-1',
    content: 'Confirmed! See you there.',
    direction: 'inbound',
    status: 'received',
    timestamp: '2024-01-15T09:35:00Z',
  },
  {
    id: 'msg-3',
    workerId: 'worker-2',
    content: 'Liam, can you cover the afternoon shift at Westfield today? 2pm-6pm.',
    direction: 'outbound',
    status: 'delivered',
    timestamp: '2024-01-15T08:00:00Z',
  },
  {
    id: 'msg-4',
    workerId: 'worker-2',
    content: 'Yes, I can do that. What floor?',
    direction: 'inbound',
    status: 'received',
    timestamp: '2024-01-15T08:15:00Z',
  },
  {
    id: 'msg-5',
    workerId: 'worker-2',
    content: 'Level 3, food court area. Thanks Liam!',
    direction: 'outbound',
    status: 'delivered',
    timestamp: '2024-01-15T08:20:00Z',
  },
  {
    id: 'msg-6',
    workerId: 'worker-3',
    content: 'Olivia, reminder: Team meeting tomorrow at 9am in the main office.',
    direction: 'outbound',
    status: 'delivered',
    timestamp: '2024-01-14T16:00:00Z',
  },
  {
    id: 'msg-7',
    workerId: 'worker-5',
    content: 'Good morning Ava! Your schedule for next week is ready. Check the app for details.',
    direction: 'outbound',
    status: 'delivered',
    timestamp: '2024-01-15T07:00:00Z',
  },
  {
    id: 'msg-8',
    workerId: 'worker-6',
    content: 'Sophia, you are assigned to Ward 3B for tonight. Please report to Nurse Station by 7pm.',
    direction: 'outbound',
    status: 'delivered',
    timestamp: '2024-01-15T14:00:00Z',
  },
  {
    id: 'msg-9',
    workerId: 'worker-6',
    content: 'Understood. On my way.',
    direction: 'inbound',
    status: 'received',
    timestamp: '2024-01-15T18:30:00Z',
  },
  {
    id: 'msg-10',
    workerId: 'worker-11',
    content: 'Ethan, pickup at 42 Spencer St, deliver to 88 Flinders Lane. ETA requested.',
    direction: 'outbound',
    status: 'delivered',
    timestamp: '2024-01-15T10:00:00Z',
  },
  {
    id: 'msg-11',
    workerId: 'worker-11',
    content: 'Picking up now. ETA to destination is 25 mins.',
    direction: 'inbound',
    status: 'received',
    timestamp: '2024-01-15T10:05:00Z',
  },
  {
    id: 'msg-12',
    workerId: 'worker-12',
    content: 'Charlotte, urgent delivery needed to Geelong. Can you take it?',
    direction: 'outbound',
    status: 'delivered',
    timestamp: '2024-01-15T11:30:00Z',
  },
]

// Demo Conversations (aggregated view)
export const demoConversations: Conversation[] = [
  {
    workerId: 'worker-1',
    workerName: 'Emma Johnson',
    workerPhone: '+61412345001',
    lastMessage: 'Confirmed! See you there.',
    lastMessageTime: '2024-01-15T09:35:00Z',
    unreadCount: 0,
    status: 'active',
  },
  {
    workerId: 'worker-2',
    workerName: 'Liam Williams',
    workerPhone: '+61412345002',
    lastMessage: 'Level 3, food court area. Thanks Liam!',
    lastMessageTime: '2024-01-15T08:20:00Z',
    unreadCount: 0,
    status: 'active',
  },
  {
    workerId: 'worker-6',
    workerName: 'Sophia Garcia',
    workerPhone: '+61412345006',
    lastMessage: 'Understood. On my way.',
    lastMessageTime: '2024-01-15T18:30:00Z',
    unreadCount: 1,
    status: 'active',
  },
  {
    workerId: 'worker-11',
    workerName: 'Ethan White',
    workerPhone: '+61412345011',
    lastMessage: 'Picking up now. ETA to destination is 25 mins.',
    lastMessageTime: '2024-01-15T10:05:00Z',
    unreadCount: 0,
    status: 'active',
  },
  {
    workerId: 'worker-12',
    workerName: 'Charlotte Harris',
    workerPhone: '+61412345012',
    lastMessage: 'Charlotte, urgent delivery needed to Geelong. Can you take it?',
    lastMessageTime: '2024-01-15T11:30:00Z',
    unreadCount: 0,
    status: 'active',
  },
]

// Demo Shifts
export const demoShifts: Shift[] = [
  {
    id: 'shift-1',
    workerId: 'worker-1',
    workerName: 'Emma Johnson',
    date: '2024-01-16',
    startTime: '08:00',
    endTime: '16:00',
    location: '123 Collins St',
    status: 'confirmed',
  },
  {
    id: 'shift-2',
    workerId: 'worker-2',
    workerName: 'Liam Williams',
    date: '2024-01-16',
    startTime: '14:00',
    endTime: '22:00',
    location: 'Westfield Shopping Centre',
    status: 'scheduled',
  },
  {
    id: 'shift-3',
    workerId: 'worker-3',
    workerName: 'Olivia Brown',
    date: '2024-01-16',
    startTime: '06:00',
    endTime: '14:00',
    location: 'Southbank Office Tower',
    status: 'confirmed',
  },
  {
    id: 'shift-4',
    workerId: 'worker-5',
    workerName: 'Ava Martinez',
    date: '2024-01-16',
    startTime: '09:00',
    endTime: '17:00',
    location: '45 Bourke St',
    status: 'scheduled',
  },
  {
    id: 'shift-5',
    workerId: 'worker-6',
    workerName: 'Sophia Garcia',
    date: '2024-01-16',
    startTime: '19:00',
    endTime: '07:00',
    location: 'Ward 3B',
    status: 'confirmed',
  },
  {
    id: 'shift-6',
    workerId: 'worker-7',
    workerName: 'Jackson Lee',
    date: '2024-01-16',
    startTime: '07:00',
    endTime: '19:00',
    location: 'Emergency Dept',
    status: 'in_progress',
  },
  {
    id: 'shift-7',
    workerId: 'worker-11',
    workerName: 'Ethan White',
    date: '2024-01-16',
    startTime: '05:00',
    endTime: '13:00',
    location: 'Metro Routes',
    status: 'in_progress',
  },
  {
    id: 'shift-8',
    workerId: 'worker-12',
    workerName: 'Charlotte Harris',
    date: '2024-01-16',
    startTime: '08:00',
    endTime: '18:00',
    location: 'Regional Deliveries',
    status: 'scheduled',
  },
]

// Demo Tasks
export const demoTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Deep clean conference room',
    description: 'Full carpet clean, windows, and furniture polish needed for client meeting',
    assignedTo: 'worker-1',
    assignedToName: 'Emma Johnson',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2024-01-16',
    createdAt: '2024-01-14T10:00:00Z',
  },
  {
    id: 'task-2',
    title: 'Restock cleaning supplies',
    description: 'Check inventory and order missing supplies for next week',
    assignedTo: 'worker-3',
    assignedToName: 'Olivia Brown',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-01-17',
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'task-3',
    title: 'Train new equipment usage',
    description: 'Show new floor buffer operation to morning team',
    assignedTo: 'worker-5',
    assignedToName: 'Ava Martinez',
    status: 'done',
    priority: 'low',
    createdAt: '2024-01-10T14:00:00Z',
  },
  {
    id: 'task-4',
    title: 'Patient transport - Ward 2A to Radiology',
    description: 'Wheelchair transport for patient in room 204',
    assignedTo: 'worker-8',
    assignedToName: 'Isabella Kim',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2024-01-15T11:00:00Z',
  },
  {
    id: 'task-5',
    title: 'Deliver urgent package to Geelong',
    description: 'Medical supplies, time-sensitive delivery',
    assignedTo: 'worker-12',
    assignedToName: 'Charlotte Harris',
    status: 'todo',
    priority: 'high',
    dueDate: '2024-01-15',
    createdAt: '2024-01-15T11:30:00Z',
  },
  {
    id: 'task-6',
    title: 'Vehicle maintenance check',
    description: 'Complete pre-trip inspection and report any issues',
    assignedTo: 'worker-11',
    assignedToName: 'Ethan White',
    status: 'done',
    priority: 'medium',
    createdAt: '2024-01-15T05:00:00Z',
  },
]

// Demo Worker Groups
export const demoGroups: WorkerGroup[] = [
  {
    id: 'group-morning',
    name: 'Morning Shift',
    description: 'Workers available for early morning shifts (6am-2pm)',
    color: '#3B82F6',
    memberCount: 3,
    memberIds: ['worker-1', 'worker-3', 'worker-5'],
  },
  {
    id: 'group-afternoon',
    name: 'Afternoon Shift',
    description: 'Workers available for afternoon shifts (2pm-10pm)',
    color: '#10B981',
    memberCount: 1,
    memberIds: ['worker-2'],
  },
  {
    id: 'group-night',
    name: 'Night Shift',
    description: 'Workers available for overnight shifts',
    color: '#6366F1',
    memberCount: 1,
    memberIds: ['worker-4'],
  },
  {
    id: 'group-cbd',
    name: 'CBD Area',
    description: 'Workers covering central business district locations',
    color: '#F59E0B',
    memberCount: 3,
    memberIds: ['worker-1', 'worker-2', 'worker-5'],
  },
  {
    id: 'group-nurses',
    name: 'Nursing Staff',
    description: 'Registered nurses and enrolled nurses',
    color: '#EF4444',
    memberCount: 3,
    memberIds: ['worker-6', 'worker-7', 'worker-9'],
  },
  {
    id: 'group-drivers',
    name: 'Drivers',
    description: 'Licensed delivery drivers',
    color: '#8B5CF6',
    memberCount: 3,
    memberIds: ['worker-11', 'worker-12', 'worker-14'],
  },
]

// Demo Message Templates
export const demoTemplates: MessageTemplate[] = [
  {
    id: 'template-1',
    name: 'Shift Reminder',
    content: 'Hi {{name}}, reminder: Your shift starts at {{time}} at {{location}}. Please confirm.',
    category: 'Scheduling',
    variables: ['name', 'time', 'location'],
    usageCount: 145,
  },
  {
    id: 'template-2',
    name: 'Shift Cancellation',
    content: 'Hi {{name}}, your shift on {{date}} has been cancelled. We apologize for any inconvenience.',
    category: 'Scheduling',
    variables: ['name', 'date'],
    usageCount: 23,
  },
  {
    id: 'template-3',
    name: 'Availability Check',
    content: 'Hi {{name}}, are you available to work on {{date}}? Reply YES or NO.',
    category: 'Scheduling',
    variables: ['name', 'date'],
    usageCount: 89,
  },
  {
    id: 'template-4',
    name: 'Task Assignment',
    content: '{{name}}, new task assigned: {{task}}. Due by {{dueDate}}. Reply DONE when complete.',
    category: 'Tasks',
    variables: ['name', 'task', 'dueDate'],
    usageCount: 67,
  },
  {
    id: 'template-5',
    name: 'Team Meeting',
    content: 'Team meeting on {{date}} at {{time}} in {{location}}. Attendance is required.',
    category: 'General',
    variables: ['date', 'time', 'location'],
    usageCount: 34,
  },
  {
    id: 'template-6',
    name: 'Emergency Alert',
    content: 'URGENT: {{message}}. Please respond immediately.',
    category: 'Emergency',
    variables: ['message'],
    usageCount: 5,
  },
  {
    id: 'template-7',
    name: 'Welcome Message',
    content: 'Welcome to {{company}}, {{name}}! We are excited to have you on the team. Your manager will be in touch shortly.',
    category: 'General',
    variables: ['company', 'name'],
    usageCount: 15,
  },
]

// Demo Broadcasts
export const demoBroadcasts: Broadcast[] = [
  {
    id: 'broadcast-1',
    message: 'Office closed tomorrow due to public holiday. Enjoy your day off!',
    recipientCount: 5,
    sentAt: '2024-01-14T16:00:00Z',
    status: 'sent',
    deliveredCount: 5,
    failedCount: 0,
  },
  {
    id: 'broadcast-2',
    message: 'New safety protocols in effect from Monday. Please review the updated guidelines.',
    recipientCount: 5,
    sentAt: '2024-01-12T09:00:00Z',
    status: 'sent',
    deliveredCount: 4,
    failedCount: 1,
  },
  {
    id: 'broadcast-3',
    message: 'Reminder: Timesheets due by 5pm Friday.',
    recipientCount: 5,
    sentAt: '2024-01-11T10:00:00Z',
    status: 'sent',
    deliveredCount: 5,
    failedCount: 0,
  },
]

// Demo Analytics Data
export const demoDailyStats: DailyStats[] = [
  { date: '2024-01-09', messagesSent: 45, messagesReceived: 32, responseRate: 0.71 },
  { date: '2024-01-10', messagesSent: 52, messagesReceived: 41, responseRate: 0.79 },
  { date: '2024-01-11', messagesSent: 38, messagesReceived: 28, responseRate: 0.74 },
  { date: '2024-01-12', messagesSent: 61, messagesReceived: 48, responseRate: 0.79 },
  { date: '2024-01-13', messagesSent: 29, messagesReceived: 22, responseRate: 0.76 },
  { date: '2024-01-14', messagesSent: 15, messagesReceived: 12, responseRate: 0.80 },
  { date: '2024-01-15', messagesSent: 47, messagesReceived: 35, responseRate: 0.74 },
]

// Overview Statistics
export function getOverviewStats(organizationId: string): OverviewStats {
  const orgWorkers = demoWorkers.filter(w => w.organizationId === organizationId)
  const activeWorkers = orgWorkers.filter(w => w.status === 'active')
  
  return {
    totalWorkers: orgWorkers.length,
    activeWorkers: activeWorkers.length,
    messagesToday: 47,
    messagesThisWeek: 287,
    pendingTasks: demoTasks.filter(t => t.status !== 'done').length,
    shiftsToday: demoShifts.filter(s => s.date === '2024-01-16').length,
    responseRate: 0.76,
    unreadMessages: 1,
  }
}

// Helper to get workers by organization
export function getWorkersByOrganization(organizationId: string): Worker[] {
  return demoWorkers.filter(w => w.organizationId === organizationId)
}

// Helper to get messages for a worker
export function getMessagesForWorker(workerId: string): Message[] {
  return demoMessages.filter(m => m.workerId === workerId)
}

// Helper to get shifts for today
export function getTodaysShifts(organizationId: string): Shift[] {
  const orgWorkerIds = demoWorkers
    .filter(w => w.organizationId === organizationId)
    .map(w => w.id)
  return demoShifts.filter(s => orgWorkerIds.includes(s.workerId) && s.date === '2024-01-16')
}

// Helper to get tasks by organization
export function getTasksByOrganization(organizationId: string): Task[] {
  const orgWorkerIds = demoWorkers
    .filter(w => w.organizationId === organizationId)
    .map(w => w.id)
  return demoTasks.filter(t => orgWorkerIds.includes(t.assignedTo))
}

// Helper to get conversations for an organization
export function getConversations(organizationId: string): Conversation[] {
  const orgWorkerIds = demoWorkers
    .filter(w => w.organizationId === organizationId)
    .map(w => w.id)
  return demoConversations.filter(c => orgWorkerIds.includes(c.workerId))
}

// Helper to get today's shifts (renamed for consistency)
export function getTodayShifts(organizationId: string): Shift[] {
  const orgWorkerIds = demoWorkers
    .filter(w => w.organizationId === organizationId)
    .map(w => w.id)
  // Using a fixed demo date for consistency
  const today = '2024-01-16'
  return demoShifts.filter(s => orgWorkerIds.includes(s.workerId) && s.date === today)
}

// Recent activity types
interface ActivityItem {
  type: 'message' | 'shift' | 'task' | 'worker'
  description: string
  timestamp: string
}

// Helper to get recent activity
export function getRecentActivity(organizationId: string): ActivityItem[] {
  const orgWorkerIds = demoWorkers
    .filter(w => w.organizationId === organizationId)
    .map(w => w.id)
  
  const activities: ActivityItem[] = []
  
  // Add recent messages
  demoMessages
    .filter(m => orgWorkerIds.includes(m.workerId))
    .slice(0, 3)
    .forEach(m => {
      const worker = demoWorkers.find(w => w.id === m.workerId)
      activities.push({
        type: 'message',
        description: m.direction === 'outbound' 
          ? `Sent message to ${worker?.name}`
          : `Received reply from ${worker?.name}`,
        timestamp: m.timestamp,
      })
    })
  
  // Add shift updates
  demoShifts
    .filter(s => orgWorkerIds.includes(s.workerId))
    .slice(0, 2)
    .forEach(s => {
      activities.push({
        type: 'shift',
        description: `${s.workerName} shift ${s.status} for ${s.date}`,
        timestamp: new Date().toISOString(),
      })
    })
  
  // Add task updates
  demoTasks
    .filter(t => orgWorkerIds.includes(t.assignedTo))
    .slice(0, 2)
    .forEach(t => {
      activities.push({
        type: 'task',
        description: `${t.title} assigned to ${t.assignedToName}`,
        timestamp: t.createdAt,
      })
    })
  
  return activities.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}
