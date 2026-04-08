'use client'

import { useTerminology, usePlugins } from '@/lib/workspace/workspace-context'
import { Button } from '@/components/ui/button'
import { 
  UserPlus, 
  MessageSquarePlus, 
  CalendarPlus, 
  Radio,
  FileText,
  Users
} from 'lucide-react'
import Link from 'next/link'

export function QuickActionsWidget() {
  const { t } = useTerminology()
  const { isPluginEnabled } = usePlugins()

  const actions = [
    {
      label: `Add ${t('worker', true)}`,
      icon: UserPlus,
      href: '/workers?action=add',
      color: 'text-primary',
      always: true,
    },
    {
      label: `Send ${t('message', true)}`,
      icon: MessageSquarePlus,
      href: '/messages',
      color: 'text-success',
      always: true,
    },
    {
      label: `Schedule ${t('shift', true)}`,
      icon: CalendarPlus,
      href: '/shifts?action=add',
      color: 'text-warning',
      pluginId: 'shifts' as const,
    },
    {
      label: 'Broadcast',
      icon: Radio,
      href: '/broadcast',
      color: 'text-destructive',
      pluginId: 'broadcast' as const,
    },
    {
      label: 'Use Template',
      icon: FileText,
      href: '/templates',
      color: 'text-primary',
      pluginId: 'templates' as const,
    },
    {
      label: `Manage ${t('groups', true)}`,
      icon: Users,
      href: '/groups',
      color: 'text-muted-foreground',
      pluginId: 'groups' as const,
    },
  ]

  const visibleActions = actions.filter(action => 
    action.always || (action.pluginId && isPluginEnabled(action.pluginId))
  )

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Quick Actions</h3>
      </div>
      <div className="flex-1 p-4 grid grid-cols-2 gap-2 content-start">
        {visibleActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto py-4 flex-col gap-2 justify-center"
            asChild
          >
            <Link href={action.href}>
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
