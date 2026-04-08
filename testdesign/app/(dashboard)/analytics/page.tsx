'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { demoDailyStats, getOverviewStats } from '@/lib/data/demo-data'
import { Header } from '@/components/dashboard/header'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'
import { Download, MessageSquare, TrendingUp, Users, Clock } from 'lucide-react'

export default function AnalyticsPage() {
  const { organization } = useAuth()
  const stats = organization ? getOverviewStats(organization.id) : null

  // Transform data for charts
  const chartData = demoDailyStats.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-AU', { weekday: 'short' }),
    sent: day.messagesSent,
    received: day.messagesReceived,
    responseRate: Math.round(day.responseRate * 100),
  }))

  return (
    <>
      <Header title="Analytics & Reports" />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
              <p className="text-muted-foreground">
                Track messaging performance and worker engagement
              </p>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="7days">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Messages Sent"
              value={stats?.messagesThisWeek || 287}
              description="This week"
              icon={<MessageSquare className="h-4 w-4" />}
              trend={{ value: 12, isPositive: true }}
            />
            <StatsCard
              title="Response Rate"
              value={`${Math.round((stats?.responseRate || 0.76) * 100)}%`}
              description="Average response"
              icon={<TrendingUp className="h-4 w-4" />}
              trend={{ value: 3, isPositive: true }}
            />
            <StatsCard
              title="Active Workers"
              value={stats?.activeWorkers || 12}
              description={`of ${stats?.totalWorkers || 15} total`}
              icon={<Users className="h-4 w-4" />}
            />
            <StatsCard
              title="Avg Response Time"
              value="12 min"
              description="Worker response"
              icon={<Clock className="h-4 w-4" />}
              trend={{ value: 8, isPositive: true }}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Message Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Message Volume</CardTitle>
                <CardDescription>Sent and received messages over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        className="text-xs fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="sent" fill="hsl(var(--primary))" name="Sent" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="received" fill="hsl(var(--chart-2))" name="Received" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Response Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Response Rate Trend</CardTitle>
                <CardDescription>Worker response rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        className="text-xs fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value) => [`${value}%`, 'Response Rate']}
                      />
                      <defs>
                        <linearGradient id="responseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="responseRate"
                        stroke="hsl(var(--chart-2))"
                        fill="url(#responseGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Summary</CardTitle>
              <CardDescription>Key performance indicators for this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                  <p className="text-2xl font-bold mt-1">287</p>
                  <p className="text-xs text-success mt-1">+45 from last week</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Delivery Rate</p>
                  <p className="text-2xl font-bold mt-1">98.2%</p>
                  <p className="text-xs text-muted-foreground mt-1">5 failed deliveries</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Most Active Worker</p>
                  <p className="text-2xl font-bold mt-1">Emma J.</p>
                  <p className="text-xs text-muted-foreground mt-1">47 messages exchanged</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Peak Hour</p>
                  <p className="text-2xl font-bold mt-1">9:00 AM</p>
                  <p className="text-xs text-muted-foreground mt-1">Most messages sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
