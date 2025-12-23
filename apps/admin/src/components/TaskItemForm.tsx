import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Flag, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CreateTaskItemRequest, UpdateTaskItemRequest } from '../hooks/useTaskItems';

const taskItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high'], {
    required_error: 'Priority is required',
  }),
  status: z.enum(['pending', 'in_progress', 'completed'], {
    required_error: 'Status is required',
  }),
});

type TaskItemFormData = z.infer<typeof taskItemSchema>;

interface TaskItemFormProps {
  workerId: string;
  initialData?: {
    title?: string;
    description?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
    status?: 'pending' | 'in_progress' | 'completed';
  };
  onSubmit: (data: CreateTaskItemRequest | UpdateTaskItemRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

function formatDateForInput(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Format as YYYY-MM-DD
  return date.toISOString().slice(0, 10);
}

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'text-gray-700 bg-gray-100' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-700 bg-yellow-100' },
  { value: 'high', label: 'High', color: 'text-red-700 bg-red-100' },
] as const;

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'text-gray-700 bg-gray-100' },
  { value: 'in_progress', label: 'In Progress', color: 'text-blue-700 bg-blue-100' },
  { value: 'completed', label: 'Completed', color: 'text-green-700 bg-green-100' },
] as const;

export function TaskItemForm({
  workerId,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: TaskItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TaskItemFormData>({
    resolver: zodResolver(taskItemSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      dueDate: formatDateForInput(initialData?.dueDate),
      priority: initialData?.priority || 'medium',
      status: initialData?.status || 'pending',
    },
  });

  const selectedPriority = watch('priority');
  const selectedStatus = watch('status');

  const onFormSubmit = async (data: TaskItemFormData) => {
    await onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData ? 'Edit Task' : 'Add Task'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              {...register('title')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Complete report, Call client"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add task details or requirements..."
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              {...register('dueDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Flag className="inline h-4 w-4 mr-1" />
                Priority <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {priorityOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register('priority')}
                      className="mr-3"
                    />
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
              {errors.priority && (
                <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register('status')}
                      className="mr-3"
                    />
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
