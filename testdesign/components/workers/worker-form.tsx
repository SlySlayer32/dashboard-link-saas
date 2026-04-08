'use client'

import { useState } from 'react'
import { Worker } from '@/lib/data/types'
import { demoGroups } from '@/lib/data/demo-data'
import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'

interface WorkerFormProps {
  worker?: Worker | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (worker: Partial<Worker>) => void
}

export function WorkerForm({ worker, open, onOpenChange, onSubmit }: WorkerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<Worker>>({
    name: worker?.name || '',
    phone: worker?.phone || '',
    email: worker?.email || '',
    status: worker?.status || 'active',
    groups: worker?.groups || [],
    notes: worker?.notes || '',
  })

  const isEditing = !!worker

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onSubmit(formData)
    setIsSubmitting(false)
    onOpenChange(false)
  }

  const toggleGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups?.includes(groupId)
        ? prev.groups.filter(g => g !== groupId)
        : [...(prev.groups || []), groupId]
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Worker' : 'Add New Worker'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the worker details below.'
              : 'Enter the details for the new worker. They will receive an SMS welcome message.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Smith"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+61412345678"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Australian mobile format: +614XXXXXXXX
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email (Optional)</FieldLabel>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <Select
                value={formData.status}
                onValueChange={(value: Worker['status']) => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Groups</FieldLabel>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {demoGroups.map((group) => (
                  <label
                    key={group.id}
                    className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.groups?.includes(group.id)}
                      onCheckedChange={() => toggleGroup(group.id)}
                    />
                    <span className="text-sm">{group.name}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">Notes (Optional)</FieldLabel>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes about this worker..."
                rows={3}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              {isEditing ? 'Save Changes' : 'Add Worker'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
