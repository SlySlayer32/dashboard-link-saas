import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, MessageSquare, Power, PowerOff, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

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

interface DeactivateResponse {
  success: boolean;
  message: string;
}

async function toggleWorkerStatus(token: string, workerId: string, active: boolean): Promise<DeactivateResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/workers/${workerId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ active }),
  });

  if (!response.ok) {
    throw new Error('Failed to update worker status');
  }

  return response.json();
}

async function deleteWorker(token: string, workerId: string): Promise<{ message: string }> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/workers/${workerId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete worker');
  }

  return response.json();
}

export function WorkerActions({ worker }: WorkerActionsProps) {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const toggleStatusMutation = useMutation({
    mutationFn: (active: boolean) => toggleWorkerStatus(token || '', worker.id, active),
    onSuccess: () => {
      toast.success(`Worker ${worker.active ? 'deactivated' : 'activated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['worker', 'detail', worker.id] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update worker');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteWorker(token || '', worker.id),
    onSuccess: () => {
      toast.success('Worker deleted successfully');
      navigate('/workers');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete worker');
    },
  });

  const handleSendSMS = () => {
    // TODO: Open SMS modal or navigate to SMS page
    navigate(`/sms/send?workerId=${worker.id}`);
  };

  const handleEdit = () => {
    // TODO: Open edit modal or navigate to edit page
    navigate(`/workers/${worker.id}/edit`);
  };

  const handleToggleStatus = () => {
    toggleStatusMutation.mutate(!worker.active);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button
            onClick={handleSendSMS}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={!worker.active}
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Send SMS
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleEdit}
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
              disabled={toggleStatusMutation.isPending}
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
