import { Worker } from '@dashboard-link/shared';
import React from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface WorkerCardProps {
  worker: Worker;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({
  worker,
  onEdit,
  onDelete,
  disabled = false
}) => {
  const formatPhone = (phone: string) => {
    // Simple phone formatting - you might want to use a library like libphonenumber-js
    if (phone.startsWith('+61')) {
      return phone.replace('+61', '0').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return phone;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-900">{worker.name}</h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                worker.active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {worker.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="mt-2 space-y-1">
            {worker.email && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Email:</span> {worker.email}
              </p>
            )}
            <p className="text-sm text-gray-600">
              <span className="font-medium">Phone:</span> {formatPhone(worker.phone)}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Created:</span> {formatDate(worker.created_at)}
            </p>
          </div>

          {worker.metadata && Object.keys(worker.metadata).length > 0 && (
            <details className="mt-3">
              <summary className="text-sm text-gray-500 cursor-pointer">
                Additional Information
              </summary>
              <div className="mt-2 text-xs text-gray-500">
                {Object.entries(worker.metadata).map(([key, value]) => (
                  <p key={key}>
                    <span className="font-medium">{key}:</span> {String(value)}
                  </p>
                ))}
              </div>
            </details>
          )}
        </div>

        <div className="ml-4 flex-shrink-0">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              disabled={disabled}
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={disabled}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
