import type { Plugin, PluginId } from '@/lib/data/types'

export const allPlugins: Plugin[] = [
  {
    id: 'shifts',
    name: 'Shift Scheduling',
    description: 'Create and manage worker shifts with calendar view',
    icon: 'Calendar',
    href: '/shifts',
    enabled: true,
    category: 'scheduling',
  },
  {
    id: 'templates',
    name: 'Quick Reply Templates',
    description: 'Pre-written message templates for common communications',
    icon: 'FileText',
    href: '/templates',
    enabled: true,
    category: 'communication',
  },
  {
    id: 'analytics',
    name: 'Analytics & Reports',
    description: 'Message statistics, response rates, and usage reports',
    icon: 'BarChart3',
    href: '/analytics',
    enabled: true,
    category: 'reporting',
  },
  {
    id: 'groups',
    name: 'Worker Groups',
    description: 'Organize workers into teams and departments',
    icon: 'Users',
    href: '/groups',
    enabled: true,
    category: 'management',
  },
  {
    id: 'broadcast',
    name: 'Broadcast Messages',
    description: 'Send messages to multiple workers at once',
    icon: 'Radio',
    href: '/broadcast',
    enabled: true,
    category: 'communication',
  },
  {
    id: 'tasks',
    name: 'Task Assignment',
    description: 'Assign and track tasks with Kanban board',
    icon: 'CheckSquare',
    href: '/tasks',
    enabled: true,
    category: 'management',
  },
  {
    id: 'checkin',
    name: 'Location Check-in',
    description: 'Track worker check-ins and check-outs via SMS',
    icon: 'MapPin',
    href: '/checkin',
    enabled: false,
    category: 'management',
  },
  {
    id: 'emergency',
    name: 'Emergency Alerts',
    description: 'Priority broadcast for urgent situations',
    icon: 'AlertTriangle',
    href: '/emergency',
    enabled: false,
    category: 'communication',
  },
]

export function getEnabledPlugins(enabledIds: PluginId[]): Plugin[] {
  return allPlugins.filter(p => enabledIds.includes(p.id))
}

export function getPluginById(id: PluginId): Plugin | undefined {
  return allPlugins.find(p => p.id === id)
}

export function getPluginsByCategory(category: Plugin['category']): Plugin[] {
  return allPlugins.filter(p => p.category === category)
}
