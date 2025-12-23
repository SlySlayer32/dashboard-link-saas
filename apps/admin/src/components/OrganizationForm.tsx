import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquare, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { UpdateOrganizationRequest } from '../hooks/useOrganization';

const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  sms_sender_id: z.string().optional(),
  default_token_expiry_hours: z
    .number()
    .min(1, 'Token expiry must be at least 1 hour')
    .max(168, 'Token expiry cannot exceed 168 hours (7 days)'),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface OrganizationFormProps {
  organization: {
    name: string;
    sms_sender_id?: string;
    default_token_expiry_hours: number;
  };
  onSave: (data: UpdateOrganizationRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function OrganizationForm({
  organization,
  onSave,
  onCancel,
  isLoading = false,
}: OrganizationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization.name,
      sms_sender_id: organization.sms_sender_id || '',
      default_token_expiry_hours: organization.default_token_expiry_hours,
    },
  });

  const onSubmit = async (data: OrganizationFormData) => {
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Organization Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          {...register('name')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Your organization name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="sms_sender_id" className="block text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="inline h-4 w-4 mr-1" />
          SMS Sender ID
        </label>
        <input
          type="text"
          id="sms_sender_id"
          {...register('sms_sender_id')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., MyCompany"
          maxLength={11}
        />
        <p className="mt-1 text-xs text-gray-500">
          This is the name that will appear as the sender of SMS messages. Maximum 11 characters.
        </p>
        {errors.sms_sender_id && (
          <p className="mt-1 text-sm text-red-600">{errors.sms_sender_id.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="default_token_expiry_hours" className="block text-sm font-medium text-gray-700 mb-2">
          Default Token Expiry (hours)
        </label>
        <input
          type="number"
          id="default_token_expiry_hours"
          {...register('default_token_expiry_hours', { valueAsNumber: true })}
          min="1"
          max="168"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Number of hours before dashboard links expire. Range: 1-168 hours (1-7 days).
        </p>
        {errors.default_token_expiry_hours && (
          <p className="mt-1 text-sm text-red-600">{errors.default_token_expiry_hours.message}</p>
        )}
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <X className="inline h-4 w-4 mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="inline h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
