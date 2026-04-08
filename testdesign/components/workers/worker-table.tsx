'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Worker } from '@/lib/data/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MoreHorizontal, MessageSquare, Calendar, Search, Phone } from 'lucide-react'

interface WorkerTableProps {
  workers: Worker[]
  onEdit?: (worker: Worker) => void
  onMessage?: (worker: Worker) => void
}

export function WorkerTable({ workers, onEdit, onMessage }: WorkerTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = 
      worker.name.toLowerCase().includes(search.toLowerCase()) ||
      worker.phone.includes(search) ||
      worker.email?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || worker.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusColor = (status: Worker['status']) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/20'
      case 'inactive':
        return 'bg-muted text-muted-foreground border-border'
      case 'on_leave':
        return 'bg-warning/10 text-warning border-warning/20'
    }
  }

  const formatPhone = (phone: string) => {
    // Simple format for display
    return phone.replace(/^\+61/, '0').replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead className="hidden md:table-cell">Groups</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWorkers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No workers found
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(worker.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link 
                          href={`/workers/${worker.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {worker.name}
                        </Link>
                        {worker.email && (
                          <p className="text-xs text-muted-foreground">{worker.email}</p>
                        )}
                        <p className="text-xs text-muted-foreground sm:hidden flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {formatPhone(worker.phone)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="font-mono text-sm">{formatPhone(worker.phone)}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {worker.groups.slice(0, 2).map((group) => (
                        <Badge key={group} variant="secondary" className="text-xs">
                          {group.replace('group-', '').replace('-', ' ')}
                        </Badge>
                      ))}
                      {worker.groups.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{worker.groups.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(worker.status)}>
                      {worker.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/workers/${worker.id}`}>View Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(worker)}>
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onMessage?.(worker)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/shifts">
                            <Calendar className="mr-2 h-4 w-4" />
                            View Shifts
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredWorkers.length} of {workers.length} workers
      </p>
    </div>
  )
}
