'use client'

import { useState } from 'react'
import { demoGroups, demoWorkers } from '@/lib/data/demo-data'
import { Header } from '@/components/dashboard/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Plus, Users, MessageSquare, Edit, Search } from 'lucide-react'
import Link from 'next/link'

export default function GroupsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const filteredGroups = demoGroups.filter(group =>
    group.name.toLowerCase().includes(search.toLowerCase()) ||
    group.description?.toLowerCase().includes(search.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getGroupMembers = (groupId: string) => {
    const group = demoGroups.find(g => g.id === groupId)
    if (!group) return []
    return demoWorkers.filter(w => group.memberIds.includes(w.id))
  }

  return (
    <>
      <Header title="Worker Groups" />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Worker Groups</h1>
              <p className="text-muted-foreground">
                Organize workers into teams for easier management
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGroups.map((group) => {
              const members = getGroupMembers(group.id)
              
              return (
                <Card 
                  key={group.id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${group.color}20`, color: group.color }}
                        >
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{group.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {group.memberCount} members
                          </CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {group.description}
                      </p>
                    )}
                    
                    {/* Member Avatars */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex -space-x-2">
                        {members.slice(0, 4).map((member) => (
                          <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
                            <AvatarFallback 
                              className="text-[10px]"
                              style={{ backgroundColor: `${group.color}20`, color: group.color }}
                            >
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {members.length > 4 && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                            +{members.length - 4}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/broadcast?group=${group.id}`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message Group
                      </Link>
                    </Button>

                    {/* Expanded Member List */}
                    {selectedGroup === group.id && members.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Members:</p>
                        <div className="space-y-2">
                          {members.map((member) => (
                            <div key={member.id} className="flex items-center gap-2 text-sm">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{member.name}</span>
                              <Badge 
                                variant="outline" 
                                className={`ml-auto text-xs ${
                                  member.status === 'active' 
                                    ? 'text-success border-success/20' 
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {member.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredGroups.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No groups found</p>
              </CardContent>
            </Card>
          )}

          {/* Create Group Dialog */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a group to organize workers and send bulk messages
                </DialogDescription>
              </DialogHeader>
              <form>
                <FieldGroup className="py-4">
                  <Field>
                    <FieldLabel>Group Name</FieldLabel>
                    <Input placeholder="e.g., Morning Shift" />
                  </Field>
                  <Field>
                    <FieldLabel>Description (Optional)</FieldLabel>
                    <Textarea placeholder="Describe this group..." rows={2} />
                  </Field>
                  <Field>
                    <FieldLabel>Color</FieldLabel>
                    <div className="flex gap-2">
                      {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          className="h-8 w-8 rounded-full border-2 border-transparent hover:border-foreground/20 transition-colors"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Group</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </>
  )
}
