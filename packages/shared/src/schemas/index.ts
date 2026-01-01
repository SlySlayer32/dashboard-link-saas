import { z } from 'zod';

// Base API Response Schema
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({
    code: z.string(),
    message: z.string()
  }).optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number()
  }).optional()
});

export type ApiResponse<T> = z.infer<typeof ApiResponseSchema> & { data?: T };

// Worker Schemas
export const WorkerSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string().min(1).max(255),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  email: z.string().email().optional(),
  active: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true })
});

export const CreateWorkerSchema = WorkerSchema.pick({
  name: true,
  phone: true,
  email: true,
  active: true,
  metadata: true
}).extend({
  organization_id: z.string().optional()
});

export const UpdateWorkerSchema = CreateWorkerSchema.partial();

export const WorkerTokenSchema = z.object({
  id: z.string(),
  worker_id: z.string(),
  token: z.string(),
  expires_at: z.string().datetime({ offset: true }),
  created_at: z.string().datetime({ offset: true }),
  used_at: z.string().datetime({ offset: true }).optional(),
  revoked: z.boolean()
});

// Dashboard Schemas
export const DashboardStatsSchema = z.object({
  totalWorkers: z.number(),
  activeWorkers: z.number(),
  totalSmsSent: z.number(),
  totalSmsDelivered: z.number(),
  recentActivity: z.array(z.object({
    id: z.string(),
    type: z.enum(['sms_sent', 'worker_created', 'worker_updated']),
    message: z.string(),
    timestamp: z.string().datetime({ offset: true })
  }))
});

// SMS Schemas
export const SmsMessageSchema = z.object({
  id: z.string(),
  worker_id: z.string(),
  to: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  message: z.string().min(1).max(1600),
  status: z.enum(['pending', 'sent', 'delivered', 'failed']),
  cost: z.number(),
  provider_message_id: z.string().optional(),
  error_message: z.string().optional(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true })
});

export const CreateSmsSchema = SmsMessageSchema.pick({
  worker_id: true,
  to: true,
  message: true
});

// Organization Schemas
export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  settings: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true })
});

export const CreateOrganizationSchema = OrganizationSchema.pick({
  name: true,
  slug: true,
  settings: true
});

// Plugin Schemas
export const PluginSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  version: z.string(),
  enabled: z.boolean(),
  settings: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true })
});

// Query Parameter Schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10)
});

export const WorkerQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  active: z.coerce.boolean().optional(),
  organization_id: z.string().optional()
});

export const SmsQuerySchema = PaginationSchema.extend({
  worker_id: z.string().optional(),
  status: z.enum(['pending', 'sent', 'delivered', 'failed']).optional(),
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional()
});

// Error Schemas
export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional()
});

// Common validation schemas
export const UuidSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const PhoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');
export const UrlSchema = z.string().url();
export const DateTimeSchema = z.string().datetime({ offset: true });
