import type { PluginInfo } from '@dashboard-link/shared'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AirtableConfig } from './AirtableConfig'
import { GoogleCalendarConfig } from './GoogleCalendarConfig'
import { NotionConfig } from './NotionConfig'
import { FormActions } from './ui/Form'

interface PluginConfigFormProps {
  plugin: PluginInfo
  config: Record<string, unknown>
  onSave: (pluginId: string, config: Record<string, unknown>) => void
  onCancel: () => void
}

export function PluginConfigForm({ plugin, config, onSave, onCancel }: PluginConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      config: config || {},
    },
  })

  const watchedConfig = watch('config')

  const onSubmit = async (data: { config: Record<string, unknown> }) => {
    setIsLoading(true)
    try {
      await onSave(plugin.id, data.config)
    } finally {
      setIsLoading(false)
    }
  }

  const renderConfigForm = () => {
    switch (plugin.id) {
      case 'google-calendar':
        return (
          <GoogleCalendarConfig
            config={watchedConfig as Record<string, unknown>}
            onChange={(newConfig) => setValue('config', newConfig)}
          />
        )
      case 'airtable':
        return (
          <AirtableConfig
            config={watchedConfig as Record<string, unknown>}
            onChange={(newConfig) => setValue('config', newConfig)}
          />
        )
      case 'notion':
        return (
          <NotionConfig
            config={watchedConfig as Record<string, unknown>}
            onChange={(newConfig) => setValue('config', newConfig)}
          />
        )
      case 'manual':
        return (
          <div className='space-y-4'>
            <div>
              <h4 className='text-sm font-medium text-gray-900 mb-2'>Manual Configuration</h4>
              <p className='text-sm text-gray-600'>
                The manual plugin doesn't require any configuration. It allows you to manually add
                tasks and schedules for workers.
              </p>
            </div>
          </div>
        )
      default:
        return (
          <div className='space-y-4'>
            <div>
              <h4 className='text-sm font-medium text-gray-900 mb-2'>Configuration</h4>
              <p className='text-sm text-gray-600'>
                No specific configuration available for this plugin.
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className='space-y-6'>
        {renderConfigForm()}

        {plugin.webhookSupported && (
          <div className='bg-blue-50 border border-blue-200 rounded-md p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg className='h-5 w-5 text-blue-400' viewBox='0 0 20 20' fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-blue-800'>Webhook Support</h3>
                <div className='mt-2 text-sm text-blue-700'>
                  <p>This plugin supports webhooks for real-time updates.</p>
                  <p className='mt-1'>
                    Webhook URL:{' '}
                    <code className='bg-blue-100 px-1 py-0.5 rounded text-xs'>
                      {`${window.location.origin}/api/webhooks/${plugin.id}`}
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {plugin.id === 'google-calendar' && (
          <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg className='h-5 w-5 text-yellow-400' viewBox='0 0 20 20' fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-yellow-800'>Google Calendar Setup</h3>
                <div className='mt-2 text-sm text-yellow-700'>
                  <p>To configure Google Calendar, you need to:</p>
                  <ol className='list-decimal list-inside mt-1 space-y-1'>
                    <li>Create a project in Google Cloud Console</li>
                    <li>Enable the Google Calendar API</li>
                    <li>Create OAuth 2.0 credentials</li>
                    <li>Add the redirect URI to your OAuth consent screen</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <FormActions onCancel={onCancel} isSubmitting={isLoading} submitText='Save Configuration' />
    </form>
  )
}
