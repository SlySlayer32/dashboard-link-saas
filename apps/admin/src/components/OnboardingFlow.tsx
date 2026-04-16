import { createAdminWorkspacePreferences } from '@dashboard-link/shared'
import { Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useWorkspacePreferences } from './WorkspacePreferencesProvider'
import {
  dashboardStylePresetOptions,
  dashboardVisualizationIntensityOptions,
  dashboardSectionDefinitions,
  ensureValidWorkspaceDefaultRoute,
  getNextStepActions,
  getVisibleWorkspaceModules,
  moveItemInList,
  workspaceAccentOptions,
  workspaceDensityOptions,
  workspaceModuleDefinitions,
  workspaceThemeModeOptions,
} from '../lib/workspace'

const steps = ['Welcome', 'Features', 'Home View', 'Theme'] as const

export function OnboardingFlow() {
  const navigate = useNavigate()
  const {
    preferences,
    isSaving,
    onboardingSource,
    savePreferences,
    skipOnboarding,
    closeOnboarding,
  } = useWorkspacePreferences()
  const [stepIndex, setStepIndex] = useState(0)
  const [draftPreferences, setDraftPreferences] = useState(() =>
    createAdminWorkspacePreferences(preferences)
  )

  useEffect(() => {
    setDraftPreferences(createAdminWorkspacePreferences(preferences))
    setStepIndex(0)
  }, [preferences])

  const selectedModules = getVisibleWorkspaceModules(draftPreferences)
  const nextStepActions = getNextStepActions(draftPreferences)

  const updateDraft = (updater: (current: typeof draftPreferences) => typeof draftPreferences) => {
    setDraftPreferences((current) => createAdminWorkspacePreferences(updater(current)))
  }

  const toggleModule = (moduleId: (typeof workspaceModuleDefinitions)[number]['id']) => {
    updateDraft((current) => {
      const isSelected = current.visibleNavItems.includes(moduleId)
      const visibleNavItems = isSelected
        ? current.visibleNavItems.filter((item) => item !== moduleId)
        : [...current.visibleNavItems, moduleId]

      if (visibleNavItems.length === 0) {
        return current
      }

      return {
        ...current,
        visibleNavItems,
        defaultRoute: ensureValidWorkspaceDefaultRoute(visibleNavItems, current.defaultRoute),
      }
    })
  }

  const toggleSection = (sectionId: (typeof dashboardSectionDefinitions)[number]['id']) => {
    updateDraft((current) => ({
      ...current,
      dashboardSections: current.dashboardSections.includes(sectionId)
        ? current.dashboardSections.filter((item) => item !== sectionId)
        : [...current.dashboardSections, sectionId],
    }))
  }

  const moveSection = (index: number, direction: -1 | 1) => {
    updateDraft((current) => ({
      ...current,
      dashboardSections: moveItemInList(current.dashboardSections, index, direction),
    }))
  }

  const handleSkip = async () => {
    try {
      await skipOnboarding()
      toast.success('Workspace setup skipped for now')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to skip onboarding')
    }
  }

  const handleSave = async () => {
    try {
      const savedPreferences = await savePreferences(
        createAdminWorkspacePreferences({
          ...draftPreferences,
          completedAt: draftPreferences.completedAt || new Date().toISOString(),
          skippedAt: undefined,
        })
      )

      toast.success('Workspace updated')
      navigate(savedPreferences.defaultRoute, { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save workspace')
    }
  }

  return (
    <div className='fixed inset-0 z-[100] overflow-y-auto bg-[hsl(var(--cc-bg)/0.96)] backdrop-blur-sm'>
      <div className='min-h-screen px-4 py-6 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-6xl'>
          <div className='cc-panel overflow-hidden rounded-[28px] shadow-2xl'>
            <div className='grid min-h-[calc(100vh-3rem)] lg:grid-cols-[280px_minmax(0,1fr)]'>
              <aside className='border-b border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface-muted))] p-6 lg:border-b-0 lg:border-r'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='cc-kicker'>Admin Workspace</p>
                    <h1 className='mt-3 text-2xl font-semibold text-[hsl(var(--cc-text))]'>
                      Set up your workspace
                    </h1>
                    <p className='cc-text-muted mt-3 text-sm leading-6'>
                      Personalize what this admin sees first, how the home page behaves, and how the
                      interface feels.
                    </p>
                  </div>
                  {onboardingSource === 'settings' && (
                    <button
                      type='button'
                      onClick={closeOnboarding}
                      className='cc-secondary-button px-3 py-2 text-sm'
                    >
                      Close
                    </button>
                  )}
                </div>

                <div className='mt-8 space-y-3'>
                  {steps.map((step, index) => (
                    <div
                      key={step}
                      className={`rounded-2xl border px-4 py-3 ${
                        index === stepIndex
                          ? 'border-[hsl(var(--cc-primary))] bg-[hsl(var(--cc-primary-soft))]'
                          : 'border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))]'
                      }`}
                    >
                      <div className='flex items-center gap-3'>
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                            index <= stepIndex
                              ? 'bg-[hsl(var(--cc-primary))] text-[hsl(var(--cc-primary-foreground))]'
                              : 'bg-[hsl(var(--cc-surface-muted))] text-[hsl(var(--cc-text-muted))]'
                          }`}
                        >
                          {index < stepIndex ? <Check className='h-4 w-4' /> : index + 1}
                        </div>
                        <span className='text-sm font-medium text-[hsl(var(--cc-text))]'>
                          {step}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className='cc-panel-muted mt-8 rounded-3xl p-5'>
                  <p className='text-sm font-semibold text-[hsl(var(--cc-text))]'>
                    Visible modules
                  </p>
                  <div className='mt-4 flex flex-wrap gap-2'>
                    {selectedModules.map((module) => (
                      <span key={module.id} className='cc-badge'>
                        {module.shortLabel}
                      </span>
                    ))}
                  </div>
                </div>
              </aside>

              <section className='p-6 sm:p-8 lg:p-10'>
                {stepIndex === 0 && (
                  <div className='max-w-3xl'>
                    <p className='cc-kicker'>Personal onboarding</p>
                    <h2 className='mt-3 text-4xl font-semibold text-[hsl(var(--cc-text))]'>
                      Show each admin only what they need
                    </h2>
                    <p className='cc-text-muted mt-5 text-lg leading-8'>
                      Hide clutter, pick a better landing page, and choose a theme that fits the way
                      you work. You can change all of this later in Settings.
                    </p>
                    <div className='mt-10 grid gap-4 md:grid-cols-3'>
                      <div className='cc-panel-muted rounded-3xl p-5'>
                        <Sparkles className='h-5 w-5 text-[hsl(var(--cc-primary))]' />
                        <h3 className='mt-4 text-lg font-semibold text-[hsl(var(--cc-text))]'>
                          Less clutter
                        </h3>
                        <p className='cc-text-muted mt-2 text-sm leading-6'>
                          Keep only the modules you use visible in the menu.
                        </p>
                      </div>
                      <div className='cc-panel-muted rounded-3xl p-5'>
                        <h3 className='text-lg font-semibold text-[hsl(var(--cc-text))]'>
                          Better first view
                        </h3>
                        <p className='cc-text-muted mt-2 text-sm leading-6'>
                          Choose which page opens after login and what the dashboard home shows.
                        </p>
                      </div>
                      <div className='cc-panel-muted rounded-3xl p-5'>
                        <h3 className='text-lg font-semibold text-[hsl(var(--cc-text))]'>
                          Style control
                        </h3>
                        <p className='cc-text-muted mt-2 text-sm leading-6'>
                          Pick a dashboard preset, theme mode, and spacing density for this admin
                          account.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {stepIndex === 1 && (
                  <div>
                    <p className='cc-kicker'>Visible features</p>
                    <h2 className='mt-3 text-3xl font-semibold text-[hsl(var(--cc-text))]'>
                      Choose the modules to surface
                    </h2>
                    <p className='cc-text-muted mt-4 max-w-3xl text-base leading-7'>
                      These modules remain visible in the sidebar and mobile menu. Settings always
                      stays available so you can adjust the workspace later.
                    </p>
                    <div className='mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                      {workspaceModuleDefinitions.map((module) => {
                        const isSelected = draftPreferences.visibleNavItems.includes(module.id)

                        return (
                          <button
                            key={module.id}
                            type='button'
                            onClick={() => toggleModule(module.id)}
                            className={`rounded-3xl border p-5 text-left ${
                              isSelected
                                ? 'border-[hsl(var(--cc-primary))] bg-[hsl(var(--cc-primary-soft))]'
                                : 'border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))]'
                            }`}
                          >
                            <div className='flex items-start justify-between gap-4'>
                              <div>
                                <h3 className='text-lg font-semibold text-[hsl(var(--cc-text))]'>
                                  {module.label}
                                </h3>
                                <p className='cc-text-muted mt-2 text-sm leading-6'>
                                  {module.description}
                                </p>
                              </div>
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                                  isSelected
                                    ? 'border-[hsl(var(--cc-primary))] bg-[hsl(var(--cc-primary))] text-[hsl(var(--cc-primary-foreground))]'
                                    : 'border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface-muted))] text-transparent'
                                }`}
                              >
                                <Check className='h-4 w-4' />
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {stepIndex === 2 && (
                  <div className='grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]'>
                    <div>
                      <p className='cc-kicker'>Home setup</p>
                      <h2 className='mt-3 text-3xl font-semibold text-[hsl(var(--cc-text))]'>
                        Choose what shows first
                      </h2>
                      <div className='mt-8'>
                        <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
                          Default landing page
                        </p>
                        <div className='mt-4 grid gap-3 md:grid-cols-2'>
                          {selectedModules.map((module) => (
                            <button
                              key={module.id}
                              type='button'
                              onClick={() =>
                                updateDraft((current) => ({
                                  ...current,
                                  defaultRoute: module.route,
                                }))
                              }
                              className={`rounded-2xl border px-4 py-4 text-left ${
                                draftPreferences.defaultRoute === module.route
                                  ? 'border-[hsl(var(--cc-primary))] bg-[hsl(var(--cc-primary-soft))]'
                                  : 'border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))]'
                              }`}
                            >
                              <p className='text-base font-semibold text-[hsl(var(--cc-text))]'>
                                {module.label}
                              </p>
                              <p className='cc-text-muted mt-1 text-sm'>{module.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className='mt-10 space-y-3'>
                        <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
                          Dashboard sections
                        </p>
                        {dashboardSectionDefinitions.map((section) => {
                          const currentIndex = draftPreferences.dashboardSections.indexOf(
                            section.id
                          )
                          const isVisible = currentIndex >= 0

                          return (
                            <div
                              key={section.id}
                              className='cc-panel flex items-center justify-between rounded-2xl px-4 py-4'
                            >
                              <button
                                type='button'
                                onClick={() => toggleSection(section.id)}
                                className='flex items-start gap-4 text-left'
                              >
                                <div
                                  className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${
                                    isVisible
                                      ? 'border-[hsl(var(--cc-primary))] bg-[hsl(var(--cc-primary))] text-[hsl(var(--cc-primary-foreground))]'
                                      : 'border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface-muted))] text-transparent'
                                  }`}
                                >
                                  <Check className='h-3.5 w-3.5' />
                                </div>
                                <div>
                                  <p className='text-base font-semibold text-[hsl(var(--cc-text))]'>
                                    {section.label}
                                  </p>
                                  <p className='cc-text-muted mt-1 text-sm'>
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
                                      currentIndex === draftPreferences.dashboardSections.length - 1
                                    }
                                    className='cc-secondary-button p-2 disabled:opacity-40'
                                  >
                                    <ChevronDown className='h-4 w-4' />
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className='cc-panel-muted rounded-[28px] p-5'>
                      <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
                        Home summary
                      </p>
                      <div className='mt-5 space-y-4'>
                        <div>
                          <p className='text-sm font-medium text-[hsl(var(--cc-text-muted))]'>
                            Opens on
                          </p>
                          <p className='mt-1 text-lg font-semibold text-[hsl(var(--cc-text))]'>
                            {selectedModules.find(
                              (module) => module.route === draftPreferences.defaultRoute
                            )?.label || 'Dashboard'}
                          </p>
                        </div>
                        <div>
                          <p className='text-sm font-medium text-[hsl(var(--cc-text-muted))]'>
                            Dashboard order
                          </p>
                          <div className='mt-2 flex flex-wrap gap-2'>
                            {draftPreferences.dashboardSections.length > 0 ? (
                              draftPreferences.dashboardSections.map((sectionId) => (
                                <span key={sectionId} className='cc-badge'>
                                  {dashboardSectionDefinitions.find(
                                    (section) => section.id === sectionId
                                  )?.label || sectionId}
                                </span>
                              ))
                            ) : (
                              <span className='cc-text-muted text-sm'>
                                No dashboard sections selected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {stepIndex === 3 && (
                  <div className='grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]'>
                    <div>
                      <p className='cc-kicker'>Look and feel</p>
                      <h2 className='mt-3 text-3xl font-semibold text-[hsl(var(--cc-text))]'>
                        Choose a dashboard style that fits the way you work
                      </h2>
                      <div className='mt-8'>
                        <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
                          Dashboard preset
                        </p>
                        <div className='mt-4 grid gap-3 md:grid-cols-3'>
                          {dashboardStylePresetOptions.map((option) => (
                            <button
                              key={option.value}
                              type='button'
                              onClick={() =>
                                updateDraft((current) => ({
                                  ...current,
                                  dashboardStylePreset: option.value,
                                }))
                              }
                              className={`rounded-2xl border px-4 py-4 text-left ${
                                draftPreferences.dashboardStylePreset === option.value
                                  ? 'border-[hsl(var(--cc-primary))] bg-[hsl(var(--cc-primary-soft))]'
                                  : 'border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))]'
                              }`}
                            >
                              <p className='text-base font-semibold text-[hsl(var(--cc-text))]'>
                                {option.label}
                              </p>
                              <p className='cc-text-muted mt-1 text-sm'>{option.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className='mt-8'>
                        <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
                          Theme mode
                        </p>
                        <div className='mt-4 grid gap-3 md:grid-cols-3'>
                          {workspaceThemeModeOptions.map((option) => (
                            <button
                              key={option.value}
                              type='button'
                              onClick={() =>
                                updateDraft((current) => ({
                                  ...current,
                                  theme: { ...current.theme, mode: option.value },
                                }))
                              }
                              className={`rounded-2xl border px-4 py-4 text-left ${
                                draftPreferences.theme.mode === option.value
                                  ? 'border-[hsl(var(--cc-primary))] bg-[hsl(var(--cc-primary-soft))]'
                                  : 'border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))]'
                              }`}
                            >
                              <p className='text-base font-semibold text-[hsl(var(--cc-text))]'>
                                {option.label}
                              </p>
                              <p className='cc-text-muted mt-1 text-sm'>{option.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className='mt-10'>
                        <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
                          Accent
                        </p>
                        <div className='mt-4 grid gap-3 md:grid-cols-3'>
                          {workspaceAccentOptions.map((option) => (
                            <button
                              key={option.value}
                              type='button'
                              onClick={() =>
                                updateDraft((current) => ({
                                  ...current,
                                  theme: { ...current.theme, accent: option.value },
                                }))
                              }
                              className={`rounded-2xl border px-4 py-4 text-left ${
                                draftPreferences.theme.accent === option.value
                                  ? 'border-[hsl(var(--cc-primary))] bg-[hsl(var(--cc-primary-soft))]'
                                  : 'border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))]'
                              }`}
                            >
                              <p className='text-base font-semibold text-[hsl(var(--cc-text))]'>
                                {option.label}
                              </p>
                              <p className='cc-text-muted mt-1 text-sm'>{option.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className='mt-10'>
                        <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
                          Visualization intensity
                        </p>
                        <div className='mt-4 grid gap-3 md:grid-cols-3'>
                          {dashboardVisualizationIntensityOptions.map((option) => (
                            <button
                              key={option.value}
                              type='button'
                              onClick={() =>
                                updateDraft((current) => ({
                                  ...current,
                                  dashboardVisualizationIntensity: option.value,
                                }))
                              }
                              className={`rounded-2xl border px-4 py-4 text-left ${
                                draftPreferences.dashboardVisualizationIntensity === option.value
                                  ? 'border-[hsl(var(--cc-primary))] bg-[hsl(var(--cc-primary-soft))]'
                                  : 'border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))]'
                              }`}
                            >
                              <p className='text-base font-semibold text-[hsl(var(--cc-text))]'>
                                {option.label}
                              </p>
                              <p className='cc-text-muted mt-1 text-sm'>{option.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className='mt-10'>
                        <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
                          Density
                        </p>
                        <div className='mt-4 grid gap-3 md:grid-cols-2'>
                          {workspaceDensityOptions.map((option) => (
                            <button
                              key={option.value}
                              type='button'
                              onClick={() =>
                                updateDraft((current) => ({ ...current, density: option.value }))
                              }
                              className={`rounded-2xl border px-4 py-4 text-left ${
                                draftPreferences.density === option.value
                                  ? 'border-[hsl(var(--cc-primary))] bg-[hsl(var(--cc-primary-soft))]'
                                  : 'border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))]'
                              }`}
                            >
                              <p className='text-base font-semibold text-[hsl(var(--cc-text))]'>
                                {option.label}
                              </p>
                              <p className='cc-text-muted mt-1 text-sm'>{option.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className='mt-10 rounded-2xl border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))] px-4 py-4'>
                        <label className='inline-flex items-center gap-3 text-sm text-[hsl(var(--cc-text))]'>
                          <input
                            type='checkbox'
                            checked={draftPreferences.showDashboardSecondaryMetrics ?? true}
                            onChange={(event) =>
                              updateDraft((current) => ({
                                ...current,
                                showDashboardSecondaryMetrics: event.target.checked,
                              }))
                            }
                          />
                          Show secondary operational metrics on dashboard cards
                        </label>
                      </div>
                    </div>

                    <div className='space-y-6'>
                      <div className='cc-panel rounded-[28px] p-6'>
                        <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
                          Preview
                        </p>
                        <div className='mt-5 rounded-[24px] border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface-muted))] p-5'>
                          <div className='rounded-2xl bg-[hsl(var(--cc-primary))] px-4 py-4 text-[hsl(var(--cc-primary-foreground))]'>
                            <p className='text-xs uppercase tracking-[0.18em] text-white/70'>
                              Daily view
                            </p>
                            <p className='mt-2 text-xl font-semibold'>Morning operations</p>
                            <p className='mt-1 text-sm text-white/80'>
                              {selectedModules.length} modules surfaced for this admin
                            </p>
                          </div>
                          <div className='mt-4 rounded-2xl border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))] px-4 py-4'>
                            <p className='text-sm font-medium text-[hsl(var(--cc-text))]'>Preset</p>
                            <p className='cc-text-muted mt-1 text-sm'>
                              {dashboardStylePresetOptions.find(
                                (option) => option.value === draftPreferences.dashboardStylePreset
                              )?.label || 'Operations Clarity'}
                            </p>
                          </div>
                          <div className='mt-4 rounded-2xl border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))] px-4 py-4'>
                            <p className='text-sm font-medium text-[hsl(var(--cc-text))]'>
                              Density
                            </p>
                            <p className='cc-text-muted mt-1 text-sm'>
                              {draftPreferences.density || 'comfortable'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className='cc-panel-muted rounded-[28px] p-6'>
                        <p className='text-sm font-semibold uppercase tracking-[0.18em] text-[hsl(var(--cc-text-muted))]'>
                          Suggested next steps
                        </p>
                        <div className='mt-4 space-y-3'>
                          {nextStepActions.map((action) => (
                            <div
                              key={action.id}
                              className='rounded-2xl border border-[hsl(var(--cc-border))] bg-[hsl(var(--cc-surface))] px-4 py-4'
                            >
                              <p className='text-base font-semibold text-[hsl(var(--cc-text))]'>
                                {action.title}
                              </p>
                              <p className='cc-text-muted mt-1 text-sm'>{action.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className='mt-10 flex flex-col gap-3 border-t border-[hsl(var(--cc-border))] pt-6 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='flex items-center gap-3'>
                    {stepIndex > 0 && (
                      <button
                        type='button'
                        onClick={() => setStepIndex((current) => current - 1)}
                        className='cc-secondary-button px-4 py-2.5 text-sm'
                      >
                        Back
                      </button>
                    )}
                    {onboardingSource === 'required' && (
                      <button
                        type='button'
                        onClick={handleSkip}
                        disabled={isSaving}
                        className='cc-secondary-button px-4 py-2.5 text-sm disabled:opacity-40'
                      >
                        Skip for now
                      </button>
                    )}
                  </div>
                  <div className='flex items-center gap-3 self-end sm:self-auto'>
                    <span className='cc-text-muted text-sm'>
                      Step {stepIndex + 1} of {steps.length}
                    </span>
                    {stepIndex < steps.length - 1 ? (
                      <button
                        type='button'
                        onClick={() => setStepIndex((current) => current + 1)}
                        disabled={stepIndex === 1 && draftPreferences.visibleNavItems.length === 0}
                        className='cc-primary-button px-5 py-2.5 text-sm disabled:opacity-40'
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        type='button'
                        onClick={handleSave}
                        disabled={isSaving}
                        className='cc-primary-button px-5 py-2.5 text-sm disabled:opacity-40'
                      >
                        {isSaving ? 'Saving…' : 'Save workspace'}
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
