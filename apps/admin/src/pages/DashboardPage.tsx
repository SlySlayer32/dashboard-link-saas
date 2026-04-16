import { CalendarDays, ClipboardList, MessageSquare, Plus, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DashboardStats } from '../components/DashboardStats'
import { FollowUpNeededCard } from '../components/FollowUpNeededCard'
import { RecentActivity } from '../components/RecentActivity'
import { useWorkspacePreferences } from '../components/WorkspacePreferencesProvider'
import { useDashboard } from '../hooks/useDashboard'
import { useOrganization } from '../hooks/useOrganization'
import { useSendDashboardLink } from '../hooks/useSMS'

function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useDashboard()
  const { data: organization } = useOrganization()
  const sendDashboardLinkMutation = useSendDashboardLink()
  const { preferences, openOnboarding } = useWorkspacePreferences()

  const visibleModules = new Set(preferences.visibleNavItems)
  const quickActions = [
    {
      id: 'add-worker',
      visible: visibleModules.has('workers'),
      label: 'Add Worker',
      description: 'Create a new worker record before scheduling and SMS delivery.',
      onClick: () => navigate('/workers', { state: { openCreateWorker: true } }),
      className: 'cc-primary-button',
      icon: <Plus className='h-5 w-5' />,
    },
    {
      id: 'manual-data',
      visible: visibleModules.has('manual-data'),
      label: 'Open Scheduling',
      description: 'Plan schedules and tasks from the operational scheduling workspace.',
      onClick: () => navigate('/manual-data'),
      className: 'cc-success-button',
      icon: <CalendarDays className='h-5 w-5' />,
    },
    {
      id: 'workers',
      visible: visibleModules.has('workers'),
      label: 'View Workers',
      description: 'Review worker details, send links, and inspect individual delivery history.',
      onClick: () => navigate('/workers'),
      className: 'cc-secondary-strong-button',
      icon: <Users className='h-5 w-5' />,
    },
    {
      id: 'sms-logs',
      visible: visibleModules.has('sms-logs'),
      label: 'SMS Logs',
      description: 'Open the full delivery log and audit recent sends.',
      onClick: () => navigate('/sms-logs'),
      className: 'cc-dark-button',
      icon: <MessageSquare className='h-5 w-5' />,
    },
  ].filter((action) => action.visible)

  const supportingStats = [
    {
      label: 'SMS today',
      value: data?.stats.smsToday ?? 0,
    },
    {
      label: 'Opens today',
      value: data?.stats.dashboardOpensToday ?? 0,
    },
    {
      label: 'Active workers',
      value: data?.stats.activeWorkers ?? 0,
    },
  ]

  const sectionContent = {
    statistics: (
      <section key='statistics' className='mb-8'>
        <DashboardStats
          stats={
            data?.stats || {
              totalWorkers: 0,
              activeWorkers: 0,
              inactiveWorkers: 0,
              smsToday: 0,
              smsThisWeek: 0,
              dashboardOpensToday: 0,
              uniqueWorkersOpenedToday: 0,
              deliveryRateToday: 0,
              smsDeliveredToday: 0,
              smsFailedToday: 0,
              nonOpenersToday: [],
            }
          }
          isLoading={isLoading}
          showSecondaryMetrics={preferences.showDashboardSecondaryMetrics}
          visualizationIntensity={preferences.dashboardVisualizationIntensity}
        />
      </section>
    ),
    'follow-up-needed': (
      <div key='follow-up-needed' className='mb-8'>
        <FollowUpNeededCard
          items={data?.stats.nonOpenersToday || []}
          isLoading={isLoading}
          onViewWorker={(workerId) => navigate(`/workers/${workerId}`)}
          onViewAll={() => navigate('/sms-logs')}
          onResend={async (item) => {
            await sendDashboardLinkMutation.mutateAsync({
              workerId: item.workerId,
              expiresIn: `${organization?.default_token_expiry_hours || 6}h`,
            })
          }}
        />
      </div>
    ),
    'recent-activity': (
      <div key='recent-activity' className='mb-8'>
        <RecentActivity activities={data?.recentActivity || []} isLoading={isLoading} />
      </div>
    ),
    'quick-actions':
      quickActions.length > 0 ? (
        <section key='quick-actions' className='mb-8'>
          <div className='cc-panel rounded-[28px] p-6'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <p className='cc-kicker'>Shortcuts</p>
                <h2 className='mt-2 text-xl font-semibold text-[hsl(var(--cc-text))]'>
                  Move quickly through the day&apos;s workflow
                </h2>
              </div>
            </div>
            <div className='mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className={`rounded-[24px] px-5 py-5 text-left ${action.className}`}
                >
                  <div className='flex items-center justify-between gap-3'>
                    <span>{action.icon}</span>
                    <ArrowHint />
                  </div>
                  <p className='mt-5 text-base font-semibold'>{action.label}</p>
                  <p className='mt-2 text-sm text-white/80'>{action.description}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null,
    'workflow-guide': (
      <section
        key='workflow-guide'
        className='mb-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]'
      >
        <div className='cc-panel rounded-[28px] p-6'>
          <p className='cc-kicker'>Operational Rhythm</p>
          <h3 className='mt-2 text-xl font-semibold text-[hsl(var(--cc-text))]'>
            Keep the day moving from setup to confirmation
          </h3>
          <div className='mt-6 space-y-4 text-sm text-[hsl(var(--cc-text-muted))]'>
            <div className='flex items-start gap-3 rounded-[22px] border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface-muted))] px-4 py-4'>
              <Plus className='mt-0.5 h-4 w-4 text-[hsl(var(--cc-primary))]' />
              <div>
                <p className='font-semibold text-[hsl(var(--cc-text))]'>
                  1. Keep the roster current
                </p>
                <p className='mt-1'>
                  Add new workers or update contact details before you schedule or resend.
                </p>
              </div>
            </div>
            <div className='flex items-start gap-3 rounded-[22px] border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface-muted))] px-4 py-4'>
              <CalendarDays className='mt-0.5 h-4 w-4 text-emerald-600' />
              <div>
                <p className='font-semibold text-[hsl(var(--cc-text))]'>
                  2. Plan scheduling context
                </p>
                <p className='mt-1'>
                  Use Scheduling to group the day’s schedule and tasks before sending dashboard
                  links.
                </p>
              </div>
            </div>
            <div className='flex items-start gap-3 rounded-[22px] border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface-muted))] px-4 py-4'>
              <ClipboardList className='mt-0.5 h-4 w-4 text-slate-700' />
              <div>
                <p className='font-semibold text-[hsl(var(--cc-text))]'>
                  3. Follow up on non-openers fast
                </p>
                <p className='mt-1'>
                  Resend from the dashboard or inspect SMS logs before the shift starts falling
                  behind.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='cc-panel-muted rounded-[28px] p-6'>
          <p className='cc-kicker'>Supporting Context</p>
          <div className='mt-5 grid gap-3'>
            {supportingStats.map((item) => (
              <div
                key={item.label}
                className='rounded-[22px] border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))] px-4 py-4'
              >
                <p className='text-sm text-[hsl(var(--cc-text-muted))]'>{item.label}</p>
                <p className='mt-2 text-2xl font-semibold text-[hsl(var(--cc-text))]'>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          {preferences.showDashboardSecondaryMetrics && (
            <p className='mt-4 text-xs leading-6 text-[hsl(var(--cc-text-muted))]'>
              Delivery rate is calculated from today&apos;s delivered versus failed dashboard-link
              sends. Non-openers reflect the latest qualifying send per worker.
            </p>
          )}
        </div>
      </section>
    ),
  } as const

  if (error) {
    return (
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='rounded-[24px] border border-red-200 bg-red-50 p-5'>
          <h2 className='font-semibold text-red-800'>Error loading dashboard</h2>
          <p className='mt-1 text-red-600'>
            {error instanceof Error ? error.message : 'Failed to load dashboard data'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      <div className='mb-8'>
        <p className='cc-kicker'>Operations Console</p>
        <h1 className='mt-2 text-4xl font-semibold text-[hsl(var(--cc-text))]'>Dashboard</h1>
        <p className='cc-text-muted mt-3 max-w-3xl text-base leading-7'>
          Scan delivery health, catch workers who still need a resend, and move straight into
          scheduling or worker actions.
        </p>
      </div>

      {preferences.dashboardSections.length === 0 && (
        <div className='cc-panel mb-8 rounded-3xl px-6 py-8 text-center'>
          <h2 className='text-xl font-semibold text-[hsl(var(--cc-text))]'>
            Your dashboard home is currently empty
          </h2>
          <p className='cc-text-muted mt-3'>
            Add sections back in to restore the home view, or choose a different landing page.
          </p>
          <button
            type='button'
            onClick={() => openOnboarding('settings')}
            className='cc-primary-button mt-5 px-5 py-2.5 text-sm'
          >
            Customize workspace
          </button>
        </div>
      )}

      {preferences.dashboardSections.map((sectionId) => sectionContent[sectionId])}
    </div>
  )
}

function ArrowHint() {
  return <span className='text-sm font-semibold text-white/70'>Open</span>
}

export default DashboardPage
