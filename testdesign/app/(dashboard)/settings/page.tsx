'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { allPlugins } from '@/lib/plugins/plugin-registry'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  Puzzle,
  MessageSquare,
  Bell,
  Shield,
  Calendar,
  FileText,
  BarChart3,
  Users,
  Radio,
  CheckSquare,
  MapPin,
  AlertTriangle,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  FileText,
  BarChart3,
  Users,
  Radio,
  CheckSquare,
  MapPin,
  AlertTriangle,
}

export default function SettingsPage() {
  const { admin, organization } = useAuth()
  const [enabledPlugins, setEnabledPlugins] = useState<string[]>(
    organization?.enabledPlugins || []
  )

  const togglePlugin = (pluginId: string) => {
    setEnabledPlugins(prev =>
      prev.includes(pluginId)
        ? prev.filter(id => id !== pluginId)
        : [...prev, pluginId]
    )
  }

  const industryLabels: Record<string, string> = {
    cleaning: 'Cleaning Services',
    hospital: 'Healthcare',
    transport: 'Transport & Logistics',
    other: 'Other',
  }

  return (
    <>
      <Header title="Settings" />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Manage your organization settings and preferences
            </p>
          </div>

          <Tabs defaultValue="organization" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="organization" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Organization</span>
              </TabsTrigger>
              <TabsTrigger value="plugins" className="flex items-center gap-2">
                <Puzzle className="h-4 w-4" />
                <span className="hidden sm:inline">Plugins</span>
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">SMS</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
            </TabsList>

            {/* Organization Settings */}
            <TabsContent value="organization" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Profile</CardTitle>
                  <CardDescription>
                    Update your organization information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Organization Name</FieldLabel>
                      <Input defaultValue={organization?.name} />
                    </Field>
                    <Field>
                      <FieldLabel>Industry</FieldLabel>
                      <Select defaultValue={organization?.industry}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cleaning">Cleaning Services</SelectItem>
                          <SelectItem value="hospital">Healthcare</SelectItem>
                          <SelectItem value="transport">Transport & Logistics</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Timezone</FieldLabel>
                      <Select defaultValue={organization?.timezone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
                          <SelectItem value="Australia/Melbourne">Australia/Melbourne</SelectItem>
                          <SelectItem value="Australia/Brisbane">Australia/Brisbane</SelectItem>
                          <SelectItem value="Australia/Perth">Australia/Perth</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>
                  <Button className="mt-4">Save Changes</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Admin Account</CardTitle>
                  <CardDescription>
                    Your admin account details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Name</FieldLabel>
                      <Input defaultValue={admin?.name} />
                    </Field>
                    <Field>
                      <FieldLabel>Email</FieldLabel>
                      <Input defaultValue={admin?.email} type="email" />
                    </Field>
                    <Field>
                      <FieldLabel>Role</FieldLabel>
                      <Input value={admin?.role || 'Admin'} disabled className="capitalize" />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Plugin Settings */}
            <TabsContent value="plugins" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Plugins</CardTitle>
                  <CardDescription>
                    Enable or disable features for your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allPlugins.map((plugin) => {
                      const IconComponent = iconMap[plugin.icon] || Puzzle
                      const isEnabled = enabledPlugins.includes(plugin.id)
                      
                      return (
                        <div
                          key={plugin.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            }`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{plugin.name}</p>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {plugin.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {plugin.description}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => togglePlugin(plugin.id)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SMS Settings */}
            <TabsContent value="sms" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SMS Provider</CardTitle>
                  <CardDescription>
                    Configure your MobileMessage.com.au API settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel>API Username</FieldLabel>
                      <Input type="text" placeholder="Enter API username" />
                    </Field>
                    <Field>
                      <FieldLabel>API Password</FieldLabel>
                      <Input type="password" placeholder="Enter API password" />
                    </Field>
                    <Field>
                      <FieldLabel>Sender ID</FieldLabel>
                      <Input placeholder="Your company name or number" />
                      <p className="text-xs text-muted-foreground mt-1">
                        This will appear as the sender for your messages
                      </p>
                    </Field>
                  </FieldGroup>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Demo Mode</p>
                      <p className="text-xs text-muted-foreground">
                        SMS sending is currently mocked for demo purposes
                      </p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Message Settings</CardTitle>
                  <CardDescription>
                    Configure default message behavior
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Message Footer</FieldLabel>
                      <Input placeholder="e.g., - YourCompany Team" />
                      <p className="text-xs text-muted-foreground mt-1">
                        This will be appended to all outgoing messages
                      </p>
                    </Field>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">Delivery Reports</p>
                        <p className="text-xs text-muted-foreground">
                          Track message delivery status
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </FieldGroup>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose what notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">New Messages</p>
                        <p className="text-xs text-muted-foreground">
                          Get notified when workers reply
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">Shift Confirmations</p>
                        <p className="text-xs text-muted-foreground">
                          Get notified when workers confirm shifts
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">Task Updates</p>
                        <p className="text-xs text-muted-foreground">
                          Get notified when tasks are completed
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">Failed Deliveries</p>
                        <p className="text-xs text-muted-foreground">
                          Get notified when messages fail to deliver
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>
                    Account security settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <Shield className="h-8 w-8 text-success" />
                    <div>
                      <p className="font-medium">Demo Mode Active</p>
                      <p className="text-sm text-muted-foreground">
                        This is a demonstration account. In production, you would configure
                        two-factor authentication and API key management here.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
