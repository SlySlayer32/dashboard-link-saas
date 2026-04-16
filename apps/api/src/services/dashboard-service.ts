import type {
  AdminDashboardResponse,
  DashboardActivityItem,
  NonOpenerItem,
} from '@dashboard-link/shared'
import { createClient } from '@supabase/supabase-js'

type RelatedWorker =
  | {
      name?: string | null
      phone?: string | null
    }
  | Array<{
      name?: string | null
      phone?: string | null
    }>
  | null
  | undefined

type SMSRow = {
  id: string
  created_at: string
  sent_at: string
  status: string
  phone_number: string
  worker_id: string | null
  token_id: string | null
  workers?: RelatedWorker
}

type AccessRow = {
  id: string
  worker_id: string
  token_id: string | null
  accessed_at: string
  validation_status: string
  workers?: RelatedWorker
}

function getSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '')
}

function getRelatedWorker(workerRecord: RelatedWorker) {
  if (!workerRecord) {
    return null
  }

  return Array.isArray(workerRecord) ? (workerRecord[0] ?? null) : workerRecord
}

export class DashboardService {
  async getDashboardStats(organizationId: string): Promise<AdminDashboardResponse> {
    const supabase = getSupabaseAdmin()
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay()
    ).toISOString()

    const [
      workersResult,
      activeResult,
      smsToday,
      smsWeek,
      todaysAccessLogs,
      recentSms,
      recentAccess,
      todaysDashboardLinkSms,
    ] = await Promise.all([
      supabase
        .from('workers')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .is('deleted_at', null),
      supabase
        .from('workers')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('active', true)
        .is('deleted_at', null),
      supabase
        .from('sms_logs')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .gte('sent_at', todayStart),
      supabase
        .from('sms_logs')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .gte('sent_at', weekStart),
      supabase
        .from('access_logs')
        .select('id, worker_id')
        .eq('organization_id', organizationId)
        .eq('validation_status', 'success')
        .gte('accessed_at', todayStart),
      supabase
        .from('sms_logs')
        .select(
          'id, status, created_at, sent_at, phone_number, worker_id, token_id, workers(name, phone)'
        )
        .eq('organization_id', organizationId)
        .order('sent_at', { ascending: false })
        .limit(10),
      supabase
        .from('access_logs')
        .select('id, validation_status, accessed_at, worker_id, token_id, workers(name, phone)')
        .eq('organization_id', organizationId)
        .eq('validation_status', 'success')
        .order('accessed_at', { ascending: false })
        .limit(10),
      supabase
        .from('sms_logs')
        .select('id, status, sent_at, phone_number, worker_id, token_id, workers(name, phone)')
        .eq('organization_id', organizationId)
        .not('token_id', 'is', null)
        .gte('sent_at', todayStart)
        .order('sent_at', { ascending: false }),
    ])

    const totalWorkers = workersResult.count || 0
    const activeWorkers = activeResult.count || 0
    const uniqueWorkersOpenedToday = new Set(
      (todaysAccessLogs.data || []).map((log) => log.worker_id).filter(Boolean)
    ).size

    const dashboardLinkRows = (todaysDashboardLinkSms.data || []) as SMSRow[]
    const deliveredCount = dashboardLinkRows.filter((row) => row.status === 'delivered').length
    const failedCount = dashboardLinkRows.filter(
      (row) => row.status === 'failed' || row.status === 'bounced'
    ).length
    const deliveryRateToday =
      deliveredCount + failedCount > 0
        ? Math.round((deliveredCount / (deliveredCount + failedCount)) * 100)
        : 0

    const nonOpenersToday = await this.getNonOpenersToday(
      organizationId,
      todayStart,
      now,
      dashboardLinkRows
    )

    const smsActivity: DashboardActivityItem[] = ((recentSms.data || []) as SMSRow[]).map(
      (entry) => {
        const worker = getRelatedWorker(entry.workers)

        return {
          id: `sms-${entry.id}`,
          type: 'sms',
          status: entry.status,
          createdAt: entry.sent_at || entry.created_at,
          workerId: entry.worker_id || '',
          workerName: worker?.name || 'Unknown worker',
          workerPhone: worker?.phone || entry.phone_number,
          message: entry.token_id ? 'Dashboard link sent' : 'SMS sent',
        }
      }
    )

    const accessActivity: DashboardActivityItem[] = ((recentAccess.data || []) as AccessRow[]).map(
      (entry) => {
        const worker = getRelatedWorker(entry.workers)

        return {
          id: `access-${entry.id}`,
          type: 'dashboard_open',
          status: entry.validation_status,
          createdAt: entry.accessed_at,
          workerId: entry.worker_id,
          workerName: worker?.name || 'Unknown worker',
          workerPhone: worker?.phone || '',
          message: 'Dashboard opened',
        }
      }
    )

    const recentActivity = [...smsActivity, ...accessActivity]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    return {
      stats: {
        totalWorkers,
        activeWorkers,
        inactiveWorkers: totalWorkers - activeWorkers,
        smsToday: smsToday.count || 0,
        smsThisWeek: smsWeek.count || 0,
        dashboardOpensToday: todaysAccessLogs.data?.length || 0,
        uniqueWorkersOpenedToday,
        deliveryRateToday,
        smsDeliveredToday: deliveredCount,
        smsFailedToday: failedCount,
        nonOpenersToday,
      },
      recentActivity,
    }
  }

  private async getNonOpenersToday(
    organizationId: string,
    todayStart: string,
    now: Date,
    dashboardLinkRows: SMSRow[]
  ): Promise<NonOpenerItem[]> {
    const latestSendByWorker = new Map<string, SMSRow>()

    for (const row of dashboardLinkRows) {
      if (!row.worker_id || !row.token_id) {
        continue
      }

      if (row.status === 'failed' || row.status === 'bounced') {
        continue
      }

      if (!latestSendByWorker.has(row.worker_id)) {
        latestSendByWorker.set(row.worker_id, row)
      }
    }

    const latestRows = Array.from(latestSendByWorker.values())
    if (latestRows.length === 0) {
      return []
    }

    const supabase = getSupabaseAdmin()
    const tokenIds = latestRows.map((row) => row.token_id).filter(Boolean) as string[]

    const { data: accessRows } = await supabase
      .from('access_logs')
      .select('worker_id, token_id, accessed_at')
      .eq('organization_id', organizationId)
      .eq('validation_status', 'success')
      .gte('accessed_at', todayStart)
      .in('token_id', tokenIds)

    return latestRows
      .filter((row) => {
        const matchingAccess = (accessRows || []).find(
          (access) =>
            access.worker_id === row.worker_id &&
            access.token_id === row.token_id &&
            new Date(access.accessed_at).getTime() > new Date(row.sent_at).getTime()
        )

        return !matchingAccess
      })
      .map((row) => {
        const worker = getRelatedWorker(row.workers)
        const minutesSinceSent = Math.max(
          0,
          Math.floor((now.getTime() - new Date(row.sent_at).getTime()) / 60000)
        )

        return {
          workerId: row.worker_id as string,
          workerName: worker?.name || 'Unknown worker',
          workerPhone: worker?.phone || row.phone_number,
          smsLogId: row.id,
          sentAt: row.sent_at,
          smsStatus: row.status as NonOpenerItem['smsStatus'],
          tokenId: row.token_id as string,
          minutesSinceSent,
        }
      })
      .sort((a, b) => b.minutesSinceSent - a.minutesSinceSent)
  }
}
