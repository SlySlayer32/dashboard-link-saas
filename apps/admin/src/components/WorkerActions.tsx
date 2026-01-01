import { Edit, MessageSquare, Power, PowerOff, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSendDashboardLink } from '../hooks/useSMS';
import { useDeleteWorker, useUpdateWorker } from '../hooks/useWorkerMutation';
import { SMSModal } from './SMSModal';

interface WorkerData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  active: boolean;
}

interface WorkerActionsProps {
  worker: WorkerData;
}

export function WorkerActions({ worker }: WorkerActionsProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);

  const updateMutation = useUpdateWorker(worker.id);
  const deleteMutation = useDeleteWorker();
  const sendDashboardLinkMutation = useSendDashboardLink();

  const handleSendSMS = async (data: { message: string; expiresIn: string; customMessage?: string }) => {
    try {
      await sendDashboardLinkMutation.mutateAsync({
        workerId: worker.id,
        expiresIn: data.expiresIn,
        customMessage: data.customMessage || undefined,
      });
      setShowSMSModal(false);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleEdit = async (data: unknown) => {
    try {
      await updateMutation.mutateAsync(data as any);
      setShowEditModal(false);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleToggleStatus = () => {
    updateMutation.mutate({ active: !worker.active });
  };

  const handleDelete = () => {
    deleteMutation.mutate(worker.id);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button
            onClick={() => setShowSMSModal(true)}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!worker.active}
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Send SMS
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            
            <button
              onClick={handleToggleStatus}
              className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                worker.active 
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              disabled={updateMutation.isPending}
            >
              {worker.active ? (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </button>
          </div>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Worker
          </button>
        </div>
        
        {!worker.active && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              This worker is inactive. They cannot receive SMS messages until activated.
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {/* Note: WorkerForm integration needs to be fixed - temporarily disabled */}
      
      {/* SMS Modal */}
      <SMSModal
        isOpen={showSMSModal}
        onClose={() => setShowSMSModal(false)}
        onSubmit={handleSendSMS}
        isLoading={sendDashboardLinkMutation.isPending}
        workerName={worker.name}
        workerPhone={worker.phone}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Worker</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {worker.name}? This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
