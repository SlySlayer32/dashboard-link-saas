import React from 'react'
import { OnboardingPluginCard } from '../components/OnboardingPluginCard'
import { useOnboardingStore } from '../store/onboarding'

export const OnboardingFlow: React.FC = () => {
  const {
    step,
    plugins,
    selectedPlugins,
    connectedPlugins,
    setStep,
    selectPlugin,
    deselectPlugin,
    connectPlugin,
    disconnectPlugin,
    completeOnboarding,
  } = useOnboardingStore()

  const isPluginSelected = (pluginId: string) => selectedPlugins.includes(pluginId)
  const isPluginConnected = (pluginId: string) => connectedPlugins.includes(pluginId)

  const renderWelcomeStep = () => (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to CleanConnect! 🎉
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Let's set up your dashboard with the tools you already use and love.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          How it works:
        </h2>
        <div className="space-y-3 text-left">
          <div className="flex items-start">
            <span className="text-blue-500 mr-3">1️⃣</span>
            <div>
              <h3 className="font-medium text-blue-900">Select your tools</h3>
              <p className="text-blue-700 text-sm">Choose the apps and services you want to integrate</p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-blue-500 mr-3">2️⃣</span>
            <div>
              <h3 className="font-medium text-blue-900">Connect your accounts</h3>
              <p className="text-blue-700 text-sm">Securely link your existing accounts</p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-blue-500 mr-3">3️⃣</span>
            <div>
              <h3 className="font-medium text-blue-900">Customize your dashboard</h3>
              <p className="text-blue-700 text-sm">Arrange widgets to see what matters most</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setStep('plugin-selection')}
        className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
      >
        Get Started →
      </button>
    </div>
  )

  const renderPluginSelectionStep = () => (
    <div className="max-w-6xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Tools
        </h1>
        <p className="text-lg text-gray-600">
          Select the apps and services you want to integrate with your dashboard
        </p>
      </div>

      {/* Plugin Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {plugins.map((plugin) => (
          <OnboardingPluginCard
            key={plugin.id}
            plugin={plugin}
            isSelected={isPluginSelected(plugin.id)}
            isConnected={isPluginConnected(plugin.id)}
            onSelect={selectPlugin}
            onDeselect={deselectPlugin}
            onConnect={connectPlugin}
            onDisconnect={disconnectPlugin}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setStep('welcome')}
          className="text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Back
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            {selectedPlugins.length} tool{selectedPlugins.length !== 1 ? 's' : ''} selected
          </p>
          {selectedPlugins.length > 0 && (
            <p className="text-sm text-blue-600">
              {connectedPlugins.length} of {selectedPlugins.length} connected
            </p>
          )}
        </div>

        <button
          onClick={() => setStep('dashboard-setup')}
          disabled={selectedPlugins.length === 0}
          className={`
            px-6 py-2 rounded-lg font-medium transition-colors
            ${selectedPlugins.length > 0
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          Continue →
        </button>
      </div>
    </div>
  )

  const renderDashboardSetupStep = () => (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Dashboard Setup
        </h1>
        <p className="text-lg text-gray-600">
          Arrange your widgets to create your perfect workspace
        </p>
      </div>

      {/* Placeholder for drag-and-drop dashboard setup */}
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-8">
        <div className="text-4xl mb-4">🎨</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Drag & Drop Dashboard Builder
        </h3>
        <p className="text-gray-500 mb-4">
          This is where you'll arrange your connected tools into a personalized dashboard
        </p>
        <div className="text-sm text-gray-400">
          (Coming soon - for now, we'll use a default layout)
        </div>
      </div>

      {/* Connected Tools Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-green-900 mb-4">
          ✅ Connected Tools:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {plugins
            .filter(plugin => connectedPlugins.includes(plugin.id))
            .map(plugin => (
              <div key={plugin.id} className="flex items-center">
                <span className="text-2xl mr-3">{plugin.icon}</span>
                <div>
                  <h4 className="font-medium text-green-900">{plugin.name}</h4>
                  <p className="text-sm text-green-700">{plugin.description}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setStep('plugin-selection')}
          className="text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Back
        </button>

        <button
          onClick={completeOnboarding}
          className="bg-green-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
        >
          Complete Setup 🎉
        </button>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="mb-8">
        <div className="text-6xl mb-4">🎊</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          You're All Set!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your dashboard is ready to use. Start managing your tools in one place.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-green-900 mb-3">
          What's next:
        </h2>
        <div className="space-y-2 text-left">
          <div className="flex items-center">
            <span className="text-green-500 mr-3">✓</span>
            <span className="text-green-700">View your connected tools on the dashboard</span>
          </div>
          <div className="flex items-center">
            <span className="text-green-500 mr-3">✓</span>
            <span className="text-green-700">Manage your staff and communications</span>
          </div>
          <div className="flex items-center">
            <span className="text-green-500 mr-3">✓</span>
            <span className="text-green-700">Add more tools anytime in Settings</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => window.location.href = '/'}
        className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
      >
        Go to Dashboard →
      </button>
    </div>
  )

  // Render current step
  switch (step) {
    case 'welcome':
      return renderWelcomeStep()
    case 'plugin-selection':
      return renderPluginSelectionStep()
    case 'dashboard-setup':
      return renderDashboardSetupStep()
    case 'complete':
      return renderCompleteStep()
    default:
      return renderWelcomeStep()
  }
}
