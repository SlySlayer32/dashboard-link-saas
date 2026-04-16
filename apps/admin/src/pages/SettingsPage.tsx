import { createAdminWorkspacePreferences } from '@dashboard-link/shared'
import { format } from 'date-fns'
import { Building, Calendar, ChevronDown, ChevronUp, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { DangerZone } from '../components/DangerZone'
import { OrganizationForm } from '../components/OrganizationForm'
import { SMSTemplateSettings } from '../components/SMSTemplateSettings'
import { useWorkspacePreferences } from '../components/WorkspacePreferencesProvider'
import type { UpdateOrganizationRequest } from '../hooks/useOrganization'
import {
  useDeleteOrganization,
  useOrganization,
  useUpdateOrganization,
} from '../hooks/useOrganization'
import {
  dashboardSectionDefinitions,
  dashboardStylePresetOptions,
  dashboardVisualizationIntensityOptions,
  getVisibleWorkspaceModules,
  moveItemInList,
  workspaceAccentOptions,
  workspaceDensityOptions,
  workspaceThemeModeOptions,
} from '../lib/workspace'

export function SettingsPage() {
  const { data: organization, isLoading, error } = useOrganization()
  const updateMutation = useUpdateOrganization()
  const deleteMutation = useDeleteOrganization()
  const {
    preferences,
    isSaving: isSavingWorkspace,
    openOnboarding,
    resetPreferences,
    savePreferences,
  } = useWorkspacePreferences()
  const [isEditingOrganization, setIsEditingOrganization] = useState(false)
  const [workspaceDraft, setWorkspaceDraft] = useState(() =>
    createAdminWorkspacePreferences(preferences)
  )

  useEffect(() => {
    setWorkspaceDraft(createAdminWorkspacePreferences(preferences))
  }, [preferences])

  const visibleModules = getVisibleWorkspaceModules(preferences)
  const isWorkspaceDirty =
    JSON.stringify(workspaceDraft) !== JSON.stringify(createAdminWorkspacePreferences(preferences))

  const activeSectionDefinitions = useMemo(
    () =>
      workspaceDraft.dashboardSections
        .map((sectionId) => dashboardSectionDefinitions.find((section) => section.id === sectionId))
        .filter(Boolean),
    [workspaceDraft.dashboardSections]
  )

  const updateWorkspaceDraft = (
    updater: (
      current: ReturnType<typeof createAdminWorkspacePreferences>
    ) => ReturnType<typeof createAdminWorkspacePreferences>
  ) => {
    setWorkspaceDraft((current) => createAdminWorkspacePreferences(updater(current)))
  }

  const toggleSection = (sectionId: (typeof dashboardSectionDefinitions)[number]['id']) => {
    updateWorkspaceDraft((current) => ({
      ...current,
      dashboardSections: current.dashboardSections.includes(sectionId)
        ? current.dashboardSections.filter((item) => item !== sectionId)
        : [...current.dashboardSections, sectionId],
    }))
  }

  const moveSection = (index: number, direction: -1 | 1) => {
    updateWorkspaceDraft((current) => ({
      ...current,
      dashboardSections: moveItemInList(current.dashboardSections, index, direction),
    }))
  }

  const handleSave = async (data: UpdateOrganizationRequest) => {
    try {
      await updateMutation.mutateAsync(data)
      toast.success('Settings saved successfully')
      setIsEditingOrganization(false)
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : 'Failed to save settings')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync()
      toast.success('Organization deleted successfully')
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : 'Failed to delete organization'
      )
    }
  }

  const handleWorkspaceReset = async () => {
    try {
      await resetPreferences()
      toast.success('Workspace reset to defaults')
    } catch (resetError) {
      toast.error(resetError instanceof Error ? resetError.message : 'Failed to reset workspace')
    }
  }

  const handleWorkspaceSave = async () => {
    try {
      await savePreferences(workspaceDraft)
      toast.success('Workspace preferences saved')
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : 'Failed to save workspace')
    }
  }

  if (isLoading) {
    return (
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='animate-pulse'>
          <div className='mb-8 h-8 w-48 rounded bg-gray-200'></div>
          <div className='cc-panel rounded-lg p-6'>
            <div className='space-y-4'>
              <div className='h-4 w-3/4 rounded bg-gray-200'></div>
              <div className='h-4 w-1/2 rounded bg-gray-200'></div>
              <div className='h-4 w-2/3 rounded bg-gray-200'></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
          <h2 className='font-semibold text-red-800'>Error loading settings</h2>
          <p className='mt-1 text-red-600'>
            {error instanceof Error ? error.message : 'Failed to load organization settings'}
          </p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return null
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-[hsl(var(--cc-text))]'>Organization Settings</h1>
        <p className='cc-text-muted mt-2'>
          Control how this admin workspace looks, how dashboard sections behave, and how
          dashboard-link messaging is managed.
        </p>
      </div>

      <section className='cc-panel mb-6 rounded-[28px] p-6'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div>
            <p className='cc-kicker'>Workspace</p>
            <h2 className='mt-2 text-xl font-semibold text-[hsl(var(--cc-text))]'>
              Personalize the operations dashboard
            </h2>
            <p className='cc-text-muted mt-2 max-w-2xl text-sm leading-6'>
              Choose which dashboard sections show, set their order, and refine the visual style for
              this admin account before saving.
            </p>
          </div>
          <div className='flex flex-wrap gap-3'>
            <button
              type='button'
              onClick={() => openOnboarding('settings')}
              className='cc-secondary-button px-4 py-2.5 text-sm'
            >
              Open onboarding
            </button>
            <button
              type='button'
              onClick={handleWorkspaceReset}
              disabled={isSavingWorkspace}
              className='cc-secondary-button px-4 py-2.5 text-sm disabled:opacity-40'
            >
              Reset to defaults
            </button>
            <button
              type='button'
              onClick={handleWorkspaceSave}
              disabled={!isWorkspaceDirty || isSavingWorkspace}
              className='cc-primary-button px-4 py-2.5 text-sm disabled:opacity-40'
            >
              Save workspace
            </button>
          </div>
        </div>

        <div className='mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]'>
          <div className='space-y-6'>
            <div className='cc-panel-muted rounded-[28px] p-5'>
              <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
                Dashboard sections
              </p>
              <div className='mt-4 space-y-3'>
                {dashboardSectionDefinitions.map((section) => {
                  const currentIndex = workspaceDraft.dashboardSections.indexOf(section.id)
                  const isVisible = currentIndex >= 0

                  return (
                    <div
                      key={section.id}
                      className='rounded-[22px] border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))] px-4 py-4'
                    >
                      <div className='flex items-start justify-between gap-4'>
                        <button
                          type='button'
                          onClick={() => toggleSection(section.id)}
                          className='flex items-start gap-3 text-left'
                        >
                          <div
                            className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${
                              isVisible
                                ? 'border-[hsl(var(--cc-primary))] bg-[hsl(var(--cc-primary))] text-white'
                                : 'border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface-muted))]'
                            }`}
                          >
                            {isVisible ? '✓' : ''}
                          </div>
                          <div>
                            <p className='text-base font-semibold text-[hsl(var(--cc-text))]'>
                              {section.label}
                            </p>
                            <p className='mt-1 text-sm text-[hsl(var(--cc-text-muted))]'>
                              {section.description}
                            </p>
                          </div>
                        </button>
                        {isVisible && (
                          <div className='flex items-center gap-2'>
                            <button
                              type='button'
                              onClick={() => moveSection(currentIndex, -1)}
                              disabled={currentIndex === 0}
                              className='cc-secondary-button p-2 disabled:opacity-40'
                            >
                              <ChevronUp className='h-4 w-4' />
                            </button>
                            <button
                              type='button'
                              onClick={() => moveSection(currentIndex, 1)}
                              disabled={
                                currentIndex === workspaceDraft.dashboardSections.length - 1
                              }
                              className='cc-secondary-button p-2 disabled:opacity-40'
                            >
                              <ChevronDown className='h-4 w-4' />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <OptionGroup
              title='Dashboard preset'
              options={dashboardStylePresetOptions}
              activeValue={workspaceDraft.dashboardStylePreset || 'operations-clarity'}
              onSelect={(value) =>
                updateWorkspaceDraft((current) => ({
                  ...current,
                  dashboardStylePreset: value,
                }))
              }
            />

            <OptionGroup
              title='Theme mode'
              options={workspaceThemeModeOptions}
              activeValue={workspaceDraft.theme.mode}
              onSelect={(value) =>
                updateWorkspaceDraft((current) => ({
                  ...current,
                  theme: {
                    ...current.theme,
                    mode: value,
                  },
                }))
              }
            />

            <OptionGroup
              title='Accent'
              options={workspaceAccentOptions}
              activeValue={workspaceDraft.theme.accent}
              onSelect={(value) =>
                updateWorkspaceDraft((current) => ({
                  ...current,
                  theme: {
                    ...current.theme,
                    accent: value,
                  },
                }))
              }
            />

            <OptionGroup
              title='Density'
              options={workspaceDensityOptions}
              activeValue={workspaceDraft.density || 'comfortable'}
              onSelect={(value) =>
                updateWorkspaceDraft((current) => ({
                  ...current,
                  density: value,
                }))
              }
            />

            <OptionGroup
              title='Visualization intensity'
              options={dashboardVisualizationIntensityOptions}
              activeValue={workspaceDraft.dashboardVisualizationIntensity || 'balanced'}
              onSelect={(value) =>
                updateWorkspaceDraft((current) => ({
                  ...current,
                  dashboardVisualizationIntensity: value,
                }))
              }
            />

            <div className='cc-panel-muted rounded-[28px] p-5'>
              <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
                Metrics detail
              </p>
              <label className='mt-4 inline-flex items-center gap-3 text-sm text-[hsl(var(--cc-text))]'>
                <input
                  type='checkbox'
                  checked={workspaceDraft.showDashboardSecondaryMetrics ?? true}
                  onChange={(event) =>
                    updateWorkspaceDraft((current) => ({
                      ...current,
                      showDashboardSecondaryMetrics: event.target.checked,
                    }))
                  }
                />
                Show subtitles and secondary operational metrics on dashboard cards
              </label>
            </div>
          </div>

          <div className='space-y-6'>
            <div className='cc-panel-muted rounded-[28px] p-5'>
              <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
                Preview before saving
              </p>
              <div className='mt-5 rounded-[28px] border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))] p-5'>
                <div className='rounded-[24px] bg-[hsl(var(--cc-primary))] px-5 py-5 text-white'>
                  <p className='text-xs uppercase tracking-[0.18em] text-white/70'>
                    Operations clarity
                  </p>
                  <p className='mt-3 text-4xl font-semibold'>
                    {workspaceDraft.dashboardVisualizationIntensity === 'minimal'
                      ? '82%'
                      : workspaceDraft.dashboardVisualizationIntensity === 'bold'
                        ? '86%'
                        : '84%'}
                  </p>
                  <p className='mt-2 text-sm text-white/80'>
                    Delivery Rate Today
                    {(workspaceDraft.showDashboardSecondaryMetrics ?? true) &&
                      ' • 12 delivered, 2 failed'}
                  </p>
                </div>

                <div className='mt-4 grid gap-3 md:grid-cols-2'>
                  <div className='rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4'>
                    <p className='text-sm text-amber-800'>Follow-up needed</p>
                    <p className='mt-2 text-2xl font-semibold text-amber-950'>3</p>
                  </div>
                  <div className='rounded-[22px] border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface-muted))] px-4 py-4'>
                    <p className='text-sm text-[hsl(var(--cc-text-muted))]'>Workers opened</p>
                    <p className='mt-2 text-2xl font-semibold text-[hsl(var(--cc-text))]'>7</p>
                  </div>
                </div>

                <div className='mt-4'>
                  <p className='text-sm font-medium text-[hsl(var(--cc-text-muted))]'>
                    Visible dashboard sections
                  </p>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {activeSectionDefinitions.length > 0 ? (
                      activeSectionDefinitions.map((section) => (
                        <span key={section?.id} className='cc-badge'>
                          {section?.label}
                        </span>
                      ))
                    ) : (
                      <span className='text-sm text-[hsl(var(--cc-text-muted))]'>
                        No dashboard sections selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className='cc-panel-muted rounded-[28px] p-5'>
              <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
                Current shell
              </p>
              <div className='mt-5 space-y-4 text-sm'>
                <div>
                  <p className='font-medium text-[hsl(var(--cc-text-muted))]'>Visible modules</p>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {visibleModules.map((module) => (
                      <span key={module.id} className='cc-badge'>
                        {module.shortLabel}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className='font-medium text-[hsl(var(--cc-text-muted))]'>
                    Default landing page
                  </p>
                  <p className='mt-1 text-base font-semibold text-[hsl(var(--cc-text))]'>
                    {visibleModules.find((module) => module.route === preferences.defaultRoute)
                      ?.label || 'Dashboard'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className='mb-6'>
        <SMSTemplateSettings />
      </div>

      <div className='cc-panel mb-6 rounded-[28px] p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='flex items-center text-lg font-semibold text-[hsl(var(--cc-text))]'>
            <Building className='h-5 w-5 mr-2' />
            Organization Details
          </h2>
          <button
            onClick={() => setIsEditingOrganization(!isEditingOrganization)}
            className='text-sm font-medium text-[hsl(var(--cc-primary))]'
          >
            {isEditingOrganization ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
          <div>
            <p className='text-sm font-medium text-[hsl(var(--cc-text-muted))]'>Organization ID</p>
            <p className='mt-1 text-sm text-[hsl(var(--cc-text))]'>{organization.id}</p>
          </div>
          <div>
            <p className='text-sm font-medium text-[hsl(var(--cc-text-muted))]'>Created</p>
            <p className='mt-1 flex items-center text-sm text-[hsl(var(--cc-text))]'>
              <Calendar className='h-4 w-4 mr-1' />
              {format(new Date(organization.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {isEditingOrganization ? (
          <OrganizationForm
            organization={organization}
            onSave={handleSave}
            onCancel={() => setIsEditingOrganization(false)}
            isLoading={updateMutation.isPending}
          />
        ) : (
          <div className='space-y-3'>
            <div>
              <p className='text-sm font-medium text-[hsl(var(--cc-text-muted))]'>
                Organization Name
              </p>
              <p className='mt-1 text-sm text-[hsl(var(--cc-text))]'>{organization.name}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-[hsl(var(--cc-text-muted))]'>SMS Sender ID</p>
              <p className='mt-1 text-sm text-[hsl(var(--cc-text))]'>
                {organization.sms_sender_id || 'Not configured'}
              </p>
            </div>
            <div>
              <p className='text-sm font-medium text-[hsl(var(--cc-text-muted))]'>
                Default Token Expiry
              </p>
              <p className='mt-1 text-sm text-[hsl(var(--cc-text))]'>
                {organization.default_token_expiry_hours} hours
              </p>
            </div>
          </div>
        )}
      </div>

      <div className='cc-panel mb-6 rounded-[28px] p-6'>
        <h2 className='mb-4 flex items-center text-lg font-semibold text-[hsl(var(--cc-text))]'>
          <Users className='h-5 w-5 mr-2' />
          Usage Statistics
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='cc-panel-muted rounded-lg p-4 text-center'>
            <p className='text-2xl font-bold text-[hsl(var(--cc-text))]'>-</p>
            <p className='cc-text-muted mt-1 text-sm'>Active Workers</p>
          </div>
          <div className='cc-panel-muted rounded-lg p-4 text-center'>
            <p className='text-2xl font-bold text-[hsl(var(--cc-text))]'>-</p>
            <p className='cc-text-muted mt-1 text-sm'>SMS Sent This Month</p>
          </div>
          <div className='cc-panel-muted rounded-lg p-4 text-center'>
            <p className='text-2xl font-bold text-[hsl(var(--cc-text))]'>Free</p>
            <p className='cc-text-muted mt-1 text-sm'>Current Plan</p>
          </div>
        </div>
        <p className='cc-text-muted mt-4 text-center text-xs'>
          Detailed usage statistics coming soon
        </p>
      </div>

      <DangerZone
        organizationName={organization.name}
        onDelete={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

function OptionGroup<T extends string>({
  title,
  options,
  activeValue,
  onSelect,
}: {
  title: string
  options: Array<{ value: T; label: string; description: string }>
  activeValue: T
  onSelect: (value: T) => void
}) {
  return (
    <div className='cc-panel-muted rounded-[28px] p-5'>
      <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
        {title}
      </p>
      <div className='mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
        {options.map((option) => (
          <button
            key={option.value}
            type='button'
            onClick={() => onSelect(option.value)}
            className={`rounded-[22px] border px-4 py-4 text-left ${
              activeValue === option.value
                ? 'border-[hsl(var(--cc-primary))] bg-[hsl(var(--cc-primary-soft))]'
                : 'border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))]'
            }`}
          >
            <p className='text-base font-semibold text-[hsl(var(--cc-text))]'>{option.label}</p>
            <p className='cc-text-muted mt-1 text-sm'>{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default SettingsPage
