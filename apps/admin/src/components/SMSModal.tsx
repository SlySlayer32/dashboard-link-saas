import { Button } from '@dashboard-link/ui'
import { AlertCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { usePreviewSMSTemplate, useSMSTemplates } from '../hooks/useSMSTemplates'
import { Textarea } from './ui/Textarea'

const EXPIRY_OPTIONS = ['1h', '6h', '12h', '24h'] as const

interface SMSModalSubmitData {
  expiresIn: string
  customMessage?: string
  templateId?: string
}

interface SMSModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SMSModalSubmitData) => Promise<void>
  isLoading?: boolean
  workerId: string
  workerName: string
  workerPhone: string
}

function parseExpiryHours(expiresIn: string) {
  return Number.parseInt(expiresIn.replace('h', ''), 10) || 6
}

function getFallbackMessage() {
  return 'Hi {{worker_name}}, your dashboard is ready: {{dashboard_link}}'
}

export const SMSModal: React.FC<SMSModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  workerId,
  workerName,
  workerPhone,
}) => {
  const { data: templates = [] } = useSMSTemplates()
  const previewMutation = usePreviewSMSTemplate()

  const defaultTemplate = useMemo(
    () => templates.find((template) => template.isDefault) || null,
    [templates]
  )

  const [expiresIn, setExpiresIn] = useState<(typeof EXPIRY_OPTIONS)[number]>('6h')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [templateBody, setTemplateBody] = useState(getFallbackMessage())
  const [customBody, setCustomBody] = useState<string>('')
  const [renderedPreview, setRenderedPreview] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setExpiresIn('6h')
    setSelectedTemplateId(defaultTemplate?.id || '')
    setTemplateBody(defaultTemplate?.body || getFallbackMessage())
    setCustomBody('')
  }, [defaultTemplate, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const selectedTemplate = templates.find((template) => template.id === selectedTemplateId)
    setTemplateBody(selectedTemplate?.body || getFallbackMessage())
    setCustomBody('')
  }, [isOpen, selectedTemplateId, templates])

  useEffect(() => {
    if (!isOpen || !workerId) {
      return
    }

    const timer = setTimeout(async () => {
      try {
        const preview = await previewMutation.mutateAsync({
          workerId,
          expiryHours: parseExpiryHours(expiresIn),
          templateId: selectedTemplateId || undefined,
          body: customBody.trim() ? customBody : undefined,
        })

        setRenderedPreview(preview?.body || '')
      } catch {
        setRenderedPreview('')
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [customBody, expiresIn, isOpen, previewMutation, selectedTemplateId, workerId])

  const editorValue = customBody || templateBody

  const handleFormSubmit = async () => {
    await onSubmit({
      expiresIn,
      templateId: selectedTemplateId || undefined,
      customMessage: customBody.trim() ? customBody : undefined,
    })
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0'>
        <div
          className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
          onClick={onClose}
        />

        <span className='hidden sm:inline-block sm:h-screen sm:align-middle'>&#8203;</span>

        <div className='inline-block w-full transform overflow-hidden rounded-[28px] bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:max-w-3xl sm:align-middle'>
          <div className='bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4'>
            <div className='mb-4'>
              <h3 className='text-lg font-medium text-gray-900'>
                Send dashboard link to {workerName}
              </h3>
              <p className='mt-1 text-sm text-gray-500'>Phone: {workerPhone}</p>
            </div>

            <div className='grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]'>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>Template</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(event) => setSelectedTemplateId(event.target.value)}
                    disabled={isLoading}
                    className='mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm'
                  >
                    <option value=''>Use fallback message</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                        {template.isDefault ? ' (Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>Message editor</label>
                  <Textarea
                    rows={7}
                    value={editorValue}
                    disabled={isLoading}
                    onChange={(event) => setCustomBody(event.target.value)}
                    className='mt-2'
                  />
                  <p className='mt-1 text-xs text-gray-500'>
                    Edit the message for this send only. Leave the template untouched to reuse it
                    next time.
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>Link expires in</label>
                  <select
                    value={expiresIn}
                    onChange={(event) =>
                      setExpiresIn(event.target.value as (typeof EXPIRY_OPTIONS)[number])
                    }
                    disabled={isLoading}
                    className='mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm'
                  >
                    {EXPIRY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option.replace('h', ' Hour')}
                        {option === '1h' ? '' : 's'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='rounded-[24px] border border-gray-200 bg-gray-50 p-5'>
                <div className='flex items-center gap-2 text-sm font-medium text-gray-700'>
                  <AlertCircle className='h-4 w-4' />
                  Rendered preview
                </div>
                <div className='mt-4 rounded-[20px] border border-gray-200 bg-white p-4'>
                  {previewMutation.isPending ? (
                    <p className='text-sm text-gray-500'>Rendering preview…</p>
                  ) : renderedPreview ? (
                    <p className='whitespace-pre-wrap text-sm leading-6 text-gray-700'>
                      {renderedPreview}
                    </p>
                  ) : (
                    <p className='text-sm text-gray-500'>Preview unavailable</p>
                  )}
                </div>

                <div className='mt-4 rounded-[20px] border border-gray-200 bg-white p-4'>
                  <p className='text-sm font-medium text-gray-700'>Placeholders supported</p>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {['{{worker_name}}', '{{dashboard_link}}', '{{expiry_hours}}'].map(
                      (placeholder) => (
                        <span
                          key={placeholder}
                          className='rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700'
                        >
                          {placeholder}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6'>
            <Button
              type='button'
              onClick={handleFormSubmit}
              disabled={isLoading}
              loading={isLoading}
              className='w-full sm:ml-3 sm:w-auto'
            >
              Send SMS
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isLoading}
              className='mt-3 w-full sm:ml-3 sm:mt-0 sm:w-auto'
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
