import type { SMSLog } from '@dashboard-link/shared';

interface SMSStatusBadgeProps {
  status: SMSLog['status'];
}

export function SMSStatusBadge({ status }: SMSStatusBadgeProps) {
  const getStatusStyles = (status: SMSLog['status']) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: SMSLog['status']) => {
    switch (status) {
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'failed':
        return 'Failed';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(
        status
      )}`}
    >
      {getStatusText(status)}
    </span>
  );
}
