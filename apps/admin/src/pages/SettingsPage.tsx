import { format } from 'date-fns';
import { Building, Calendar, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { DangerZone } from '../components/DangerZone';
import { OrganizationForm } from '../components/OrganizationForm';
import type { UpdateOrganizationRequest } from '../hooks/useOrganization';
import { useDeleteOrganization, useOrganization, useUpdateOrganization } from '../hooks/useOrganization';

export function SettingsPage() {
  const navigate = useNavigate();
  const { data: organization, isLoading, error } = useOrganization();
  const updateMutation = useUpdateOrganization();
  const deleteMutation = useDeleteOrganization();
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async (data: UpdateOrganizationRequest) => {
    try {
      await updateMutation.mutateAsync(data);
      toast.success('Settings saved successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync();
      toast.success('Organization deleted successfully');
      // Clear auth and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete organization');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error loading settings</h2>
          <p className="text-red-600 mt-1">
            {error instanceof Error ? error.message : 'Failed to load organization settings'}
          </p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your organization's preferences and configuration
        </p>
      </div>

      {/* Organization Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Organization Details
          </h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Organization ID</p>
            <p className="mt-1 text-sm text-gray-900">{organization.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Created</p>
            <p className="mt-1 text-sm text-gray-900 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {format(new Date(organization.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {isEditing ? (
          <OrganizationForm
            organization={organization}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            isLoading={updateMutation.isPending}
          />
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Organization Name</p>
              <p className="mt-1 text-sm text-gray-900">{organization.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">SMS Sender ID</p>
              <p className="mt-1 text-sm text-gray-900">
                {organization.sms_sender_id || 'Not configured'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Default Token Expiry</p>
              <p className="mt-1 text-sm text-gray-900">
                {organization.default_token_expiry_hours} hours
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Usage Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">-</p>
            <p className="text-sm text-gray-500 mt-1">Active Workers</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">-</p>
            <p className="text-sm text-gray-500 mt-1">SMS Sent This Month</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">Free</p>
            <p className="text-sm text-gray-500 mt-1">Current Plan</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Detailed usage statistics coming soon
        </p>
      </div>

      {/* Danger Zone */}
      <DangerZone
        organizationName={organization.name}
        onDelete={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
