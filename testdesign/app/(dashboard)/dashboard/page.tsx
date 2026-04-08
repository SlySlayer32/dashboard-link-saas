'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { useWorkspace, useBranding } from '@/lib/workspace/workspace-context'
import { Header } from '@/components/dashboard/header'
import { GridDashboard } from '@/components/dashboard/grid-dashboard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { UserPlus, Send, Settings } from 'lucide-react'

export default function DashboardPage() {
  const { admin } = useAuth()
  const { settings } = useWorkspace()
  const { branding } = useBranding()
  
  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Welcome section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {admin?.name?.split(' ')[0] || 'Admin'}
              </h1>
              <p className="text-muted-foreground">
                Here&apos;s what&apos;s happening with your team today.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/workers">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add {settings.terminology.worker}
                </Link>
              </Button>
              <Button asChild>
                <Link href="/messages">
                  <Send className="mr-2 h-4 w-4" />
                  Send {settings.terminology.message}
                </Link>
              </Button>
            </div>
          </div>

          {/* Onboarding prompt if not completed */}
          {!settings.onboardingCompleted && (
            <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">Complete your workspace setup</h3>
                  <p className="text-sm text-muted-foreground">
                    Customize your branding, terminology, and dashboard layout to match your business.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/setup">
                    <Settings className="mr-2 h-4 w-4" />
                    Setup Workspace
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Drag & Drop Dashboard */}
          <GridDashboard />
        </div>
      </main>
    </>
  )
}
