import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField, FormActions } from './ui/Form';
import { formatAustralianPhone, transformPhoneInput, validateAustralianPhone } from '../utils/phoneUtils';
import { useCreateWorker, useUpdateWorker } from '../hooks/useWorkerMutation';
import type { Worker } from '@dashboard-link/shared';

// Validation schema
const workerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine(validateAustralianPhone, 'Please enter a valid Australian mobile number'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .or(z.literal(''))
    .optional(),
  active: z.boolean().default(true),
});

type WorkerFormData = z.infer<typeof workerSchema>;

interface WorkerFormProps {
  worker?: Worker; // If provided, edit mode
  onSubmit: (data: WorkerFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WorkerForm({ worker, onSubmit, onCancel, isLoading = false }: WorkerFormProps) {
  const isEdit = !!worker;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty, isValid },
  } = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: worker?.name || '',
      phone: worker?.phone || '',
      email: worker?.email || '',
      active: worker?.active !== undefined ? worker.active : true,
    },
    mode: 'onChange',
  });

  // Watch phone value for formatting
  const phoneValue = watch('phone');

  // Handle phone formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = transformPhoneInput(e.target.value);
    setValue('phone', formatted, { shouldValidate: true });
  };

  // Handle form submission
  const onFormSubmit = async (data: WorkerFormData) => {
    // Format phone number before submitting
    const formattedData = {
      ...data,
      phone: formatAustralianPhone(data.phone),
    };
    
    await onSubmit(formattedData);
  };

  // Reset form when worker prop changes (for edit mode)
  useEffect(() => {
    if (worker) {
      setValue('name', worker.name || '');
      setValue('phone', worker.phone || '');
      setValue('email', worker.email || '');
      setValue('active', worker.active !== undefined ? worker.active : true);
    }
  }, [worker, setValue]);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <FormField
        label="Worker Name"
        name="name"
        placeholder="Enter worker's full name"
        required
        disabled={isLoading}
        error={errors.name}
        registration={register}
        helperText="This is how the worker's name will appear on their dashboard"
      />

      <FormField
        label="Mobile Phone"
        name="phone"
        type="tel"
        placeholder="04xx xxx xxx"
        required
        disabled={isLoading}
        error={errors.phone}
        registration={register}
        className="mb-4"
        helperText="Australian mobile number only (e.g., 04xx xxx xxx)"
        onChange={handlePhoneChange}
        value={phoneValue}
      />

      <FormField
        label="Email Address"
        name="email"
        type="email"
        placeholder="worker@example.com"
        disabled={isLoading}
        error={errors.email}
        registration={register}
        helperText="Optional - used for sending dashboard links via email"
      />

      <div className="flex items-center space-x-2 py-2">
        <input
          type="checkbox"
          id="active"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          {...register('active')}
          disabled={isLoading}
        />
        <label htmlFor="active" className="text-sm font-medium text-gray-700">
          Worker is active
        </label>
        <span className="text-xs text-gray-500 ml-2">
          (Inactive workers won't receive dashboard links)
        </span>
      </div>

      <FormActions
        onCancel={onCancel}
        isSubmitting={isLoading}
        submitText={isEdit ? 'Update Worker' : 'Create Worker'}
        submitDisabled={!isDirty || !isValid}
      />
    </form>
  );
}

// Hook to handle worker form submission
export function useWorkerForm(worker?: Worker, onClose?: () => void) {
  const createWorker = useCreateWorker();
  const updateWorker = useUpdateWorker(worker?.id || '');

  const handleSubmit = async (data: WorkerFormData) => {
    try {
      if (worker) {
        // Update existing worker
        await updateWorker.mutateAsync(data);
      } else {
        // Create new worker
        await createWorker.mutateAsync(data);
      }
      
      // Close form/modal if provided
      if (onClose) {
        onClose();
      }
    } catch (error) {
      // Error is handled by the mutation hooks
      console.error('Worker form submission error:', error);
    }
  };

  return {
    handleSubmit,
    isLoading: createWorker.isPending || updateWorker.isPending,
  };
}
