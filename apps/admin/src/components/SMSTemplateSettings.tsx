import type { SMSTemplate } from '@dashboard-link/shared'
import { Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  useCreateSMSTemplate,
  useDeleteSMSTemplate,
  useSetDefaultSMSTemplate,
  useSMSTemplates,
  useUpdateSMSTemplate,
} from '../hooks/useSMSTemplates'
import { Textarea } from './ui/Textarea'

const DASHBOARD_LINK_PLACEHOLDERS = ['{{worker_name}}', '{{dashboard_link}}', '{{expiry_hours}}']

const initialDraft = {
  name: '',
  body: '',
  isDefault: false,
}

export function SMSTemplateSettings() {
  const { data: templates = [], isLoading } = useSMSTemplates()
  const createTemplateMutation = useCreateSMSTemplate()
  const updateTemplateMutation = useUpdateSMSTemplate()
  const deleteTemplateMutation = useDeleteSMSTemplate()
  const setDefaultTemplateMutation = useSetDefaultSMSTemplate()

  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null)
  const [draft, setDraft] = useState(initialDraft)

  useEffect(() => {
    if (!editingTemplate) {
      setDraft(initialDraft)
      return
    }

    setDraft({
      name: editingTemplate.name,
      body: editingTemplate.body,
      isDefault: editingTemplate.isDefault,
    })
  }, [editingTemplate])

  const handleSave = async () => {
    if (!draft.name.trim() || !draft.body.trim()) {
      return
    }

    if (editingTemplate) {
      await updateTemplateMutation.mutateAsync({
        id: editingTemplate.id,
        input: {
          name: draft.name.trim(),
          body: draft.body.trim(),
          isDefault: draft.isDefault,
        },
      })
    } else {
      await createTemplateMutation.mutateAsync({
        name: draft.name.trim(),
        body: draft.body.trim(),
        category: 'dashboard_link',
        isDefault: draft.isDefault,
      })
    }

    setEditingTemplate(null)
    setDraft(initialDraft)
  }

  return (
    <section className='cc-panel rounded-[28px] p-6'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <p className='cc-kicker'>Messaging</p>
          <h2 className='mt-2 text-xl font-semibold text-[hsl(var(--cc-text))]'>
            Dashboard link SMS templates
          </h2>
          <p className='cc-text-muted mt-2 max-w-2xl text-sm leading-6'>
            Set the default dashboard-link message for this organization, keep reusable variations,
            and let admins override the message before sending when needed.
          </p>
        </div>
        <button
          type='button'
          onClick={() => setEditingTemplate(null)}
          className='cc-secondary-button px-4 py-2 text-sm'
        >
          <span className='inline-flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            New template
          </span>
        </button>
      </div>

      <div className='mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)]'>
        <div className='space-y-4'>
          {isLoading ? (
            <div className='animate-pulse space-y-3'>
              {[...Array(3)].map((_, index) => (
                <div key={index} className='h-24 rounded-[24px] bg-gray-200'></div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className='rounded-[24px] border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface-muted))] px-5 py-6'>
              <p className='text-base font-semibold text-[hsl(var(--cc-text))]'>No templates yet</p>
              <p className='mt-1 text-sm text-[hsl(var(--cc-text-muted))]'>
                The send flow will fall back to the current default message until you add your first
                reusable template.
              </p>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className='rounded-[24px] border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface-muted))] px-5 py-5'
              >
                <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='text-base font-semibold text-[hsl(var(--cc-text))]'>
                        {template.name}
                      </p>
                      {template.isDefault && (
                        <span className='rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800'>
                          Default
                        </span>
                      )}
                    </div>
                    <p className='mt-3 line-clamp-3 text-sm leading-6 text-[hsl(var(--cc-text-muted))]'>
                      {template.body}
                    </p>
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    {!template.isDefault && (
                      <button
                        type='button'
                        onClick={() => setDefaultTemplateMutation.mutate(template.id)}
                        className='cc-secondary-button px-3 py-2 text-sm'
                      >
                        <span className='inline-flex items-center gap-2'>
                          <Star className='h-4 w-4' />
                          Set default
                        </span>
                      </button>
                    )}
                    <button
                      type='button'
                      onClick={() => setEditingTemplate(template)}
                      className='cc-secondary-button px-3 py-2 text-sm'
                    >
                      <span className='inline-flex items-center gap-2'>
                        <Pencil className='h-4 w-4' />
                        Edit
                      </span>
                    </button>
                    <button
                      type='button'
                      onClick={() => deleteTemplateMutation.mutate(template.id)}
                      className='rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700'
                    >
                      <span className='inline-flex items-center gap-2'>
                        <Trash2 className='h-4 w-4' />
                        Delete
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className='cc-panel-muted rounded-[28px] p-5'>
          <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
            {editingTemplate ? 'Edit Template' : 'Create Template'}
          </p>
          <div className='mt-5 space-y-4'>
            <div>
              <label className='block text-sm font-medium text-[hsl(var(--cc-text))]'>
                Template name
              </label>
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
                className='mt-2 w-full rounded-xl border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))] px-3 py-2.5 text-sm text-[hsl(var(--cc-text))]'
                placeholder='Morning reminder'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-[hsl(var(--cc-text))]'>
                Message body
              </label>
              <div className='mt-2 rounded-[22px] border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))] p-3'>
                <Textarea
                  rows={7}
                  value={draft.body}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, body: event.target.value }))
                  }
                  className='border-0 p-0 shadow-none focus:border-0 focus:ring-0'
                  placeholder='Hi {{worker_name}}, your dashboard is ready: {{dashboard_link}}'
                />
              </div>
            </div>

            <div className='rounded-[22px] border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))] px-4 py-4'>
              <p className='text-sm font-medium text-[hsl(var(--cc-text))]'>
                Available placeholders
              </p>
              <div className='mt-3 flex flex-wrap gap-2'>
                {DASHBOARD_LINK_PLACEHOLDERS.map((placeholder) => (
                  <span key={placeholder} className='cc-badge'>
                    {placeholder}
                  </span>
                ))}
              </div>
              <label className='mt-4 inline-flex items-center gap-2 text-sm text-[hsl(var(--cc-text))]'>
                <input
                  type='checkbox'
                  checked={draft.isDefault}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, isDefault: event.target.checked }))
                  }
                />
                Make this the default dashboard-link template
              </label>
            </div>

            <div className='rounded-[22px] border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))] px-4 py-4'>
              <p className='text-sm font-medium text-[hsl(var(--cc-text))]'>Preview</p>
              <p className='mt-3 whitespace-pre-wrap text-sm leading-6 text-[hsl(var(--cc-text-muted))]'>
                {draft.body.trim() ||
                  'Hi {{worker_name}}, your dashboard is ready: {{dashboard_link}}'}
              </p>
            </div>

            <div className='flex flex-wrap gap-3'>
              <button
                type='button'
                onClick={handleSave}
                disabled={
                  !draft.name.trim() ||
                  !draft.body.trim() ||
                  createTemplateMutation.isPending ||
                  updateTemplateMutation.isPending
                }
                className='cc-primary-button px-4 py-2.5 text-sm disabled:opacity-40'
              >
                {editingTemplate ? 'Save template' : 'Create template'}
              </button>
              {(editingTemplate || draft.name || draft.body) && (
                <button
                  type='button'
                  onClick={() => {
                    setEditingTemplate(null)
                    setDraft(initialDraft)
                  }}
                  className='cc-secondary-button px-4 py-2.5 text-sm'
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
