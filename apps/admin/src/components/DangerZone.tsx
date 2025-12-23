import { AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface DangerZoneProps {
  organizationName: string;
  onDelete: () => Promise<void>;
  isLoading?: boolean;
}

export function DangerZone({ organizationName, onDelete, isLoading = false }: DangerZoneProps) {
  const [confirmText, setConfirmText] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== organizationName) {
      return;
    }
    await onDelete();
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-red-900 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Danger Zone
        </h2>
      </div>

      {!showConfirm ? (
        <div>
          <p className="text-sm text-red-700 mb-4">
            Permanently delete your organization, all workers, and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Organization
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-red-100 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium mb-2">
              This action is irreversible and will permanently delete:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              <li>Your organization</li>
              <li>All workers and their data</li>
              <li>All SMS logs</li>
              <li>All schedule and task items</li>
              <li>All plugin configurations</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-red-700 mb-2">
              To confirm, type your organization name: <strong>{organizationName}</strong>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder={organizationName}
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowConfirm(false);
                setConfirmText('');
              }}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmText !== organizationName || isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Deleting...' : 'Delete Organization'}
            </button>
          </div>

          {confirmText && confirmText !== organizationName && (
            <p className="text-sm text-red-600">
              Organization name does not match. Please type it exactly to confirm.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
