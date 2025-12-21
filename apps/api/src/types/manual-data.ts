// Manual data types for schedule and task items

export interface CreateScheduleItemRequest {
  title: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  location?: string;
  description?: string;
}

export interface UpdateScheduleItemRequest {
  title?: string;
  startTime?: string; // ISO datetime
  endTime?: string; // ISO datetime
  location?: string;
  description?: string;
}

export interface CreateTaskItemRequest {
  title: string;
  description?: string;
  dueDate: string; // ISO date
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
}

export interface UpdateTaskItemRequest {
  title?: string;
  description?: string;
  dueDate?: string; // ISO date
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface ScheduleItem {
  id: string;
  organization_id: string;
  worker_id: string;
  title: string;
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  location?: string;
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TaskItem {
  id: string;
  organization_id: string;
  worker_id: string;
  title: string;
  description?: string;
  due_date?: string; // ISO date
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
