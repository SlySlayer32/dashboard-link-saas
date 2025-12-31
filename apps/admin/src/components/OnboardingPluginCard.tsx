import React from 'react'
import type { Plugin } from '../types/onboarding'

interface OnboardingPluginCardProps {
  plugin: Plugin
  isSelected: boolean
  isConnected: boolean
  onSelect: (pluginId: string) => void
  onDeselect: (pluginId: string) => void
  onConnect: (pluginId: string) => void
  onDisconnect: (pluginId: string) => void
}

export const OnboardingPluginCard: React.FC<OnboardingPluginCardProps> = ({
  plugin,
  isSelected,
  isConnected,
  onSelect,
  onDeselect,
  onConnect,
  onDisconnect,
}) => {
  const handleToggleSelection = () => {
    if (isSelected) {
      onDeselect(plugin.id)
    } else {
      onSelect(plugin.id)
    }
  }

  const handleConnection = () => {
    if (isConnected) {
      onDisconnect(plugin.id)
    } else {
      onConnect(plugin.id)
    }
  }

  return (
    <div
      className={`
        relative border-2 rounded-lg p-6 transition-all cursor-pointer
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}
        ${isConnected ? 'ring-2 ring-green-500' : ''}
      `}
      onClick={handleToggleSelection}
    >
      {/* Connection Status Badge */}
      {isConnected && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Connected
          </span>
        </div>
      )}

      {/* Plugin Header */}
      <div className="flex items-center mb-4">
        <div className="text-3xl mr-3">{plugin.icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{plugin.name}</h3>
          <span className="text-xs text-gray-500 capitalize">{plugin.category.replace('-', ' ')}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4">{plugin.description}</p>

      {/* Features */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Features:</h4>
        <ul className="space-y-1">
          {plugin.features.map((feature, index) => (
            <li key={index} className="text-xs text-gray-600 flex items-center">
              <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleToggleSelection()
          }}
          className={`
            flex-1 px-3 py-2 rounded text-sm font-medium transition-colors
            ${isSelected 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          {isSelected ? 'Selected' : 'Select'}
        </button>

        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleConnection()
            }}
            className={`
              px-3 py-2 rounded text-sm font-medium transition-colors
              ${isConnected 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }
          `}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        )}
      </div>

      {/* Setup Required Notice */}
      {plugin.setupRequired && isSelected && !isConnected && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">
            ⚠️ Setup required after connection
          </p>
        </div>
      )}
    </div>
  )
}
