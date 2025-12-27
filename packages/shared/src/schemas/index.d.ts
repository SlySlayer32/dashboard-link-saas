import { z } from 'zod'
export declare const ApiResponseSchema: z.ZodObject<
  {
    success: z.ZodBoolean
    data: z.ZodOptional<z.ZodUnknown>
    error: z.ZodOptional<
      z.ZodObject<
        {
          code: z.ZodString
          message: z.ZodString
        },
        'strip',
        z.ZodTypeAny,
        {
          code: string
          message: string
        },
        {
          code: string
          message: string
        }
      >
    >
    pagination: z.ZodOptional<
      z.ZodObject<
        {
          page: z.ZodNumber
          limit: z.ZodNumber
          total: z.ZodNumber
        },
        'strip',
        z.ZodTypeAny,
        {
          page: number
          limit: number
          total: number
        },
        {
          page: number
          limit: number
          total: number
        }
      >
    >
  },
  'strip',
  z.ZodTypeAny,
  {
    success: boolean
    data?: unknown
    error?:
      | {
          code: string
          message: string
        }
      | undefined
    pagination?:
      | {
          page: number
          limit: number
          total: number
        }
      | undefined
  },
  {
    success: boolean
    data?: unknown
    error?:
      | {
          code: string
          message: string
        }
      | undefined
    pagination?:
      | {
          page: number
          limit: number
          total: number
        }
      | undefined
  }
>
export type ApiResponse<T> = z.infer<typeof ApiResponseSchema> & {
  data?: T
}
export declare const WorkerSchema: z.ZodObject<
  {
    id: z.ZodString
    organization_id: z.ZodString
    name: z.ZodString
    phone: z.ZodString
    email: z.ZodOptional<z.ZodString>
    active: z.ZodBoolean
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>
    created_at: z.ZodString
    updated_at: z.ZodString
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string
    organization_id: string
    name: string
    phone: string
    active: boolean
    created_at: string
    updated_at: string
    email?: string | undefined
    metadata?: Record<string, unknown> | undefined
  },
  {
    id: string
    organization_id: string
    name: string
    phone: string
    active: boolean
    created_at: string
    updated_at: string
    email?: string | undefined
    metadata?: Record<string, unknown> | undefined
  }
>
export declare const CreateWorkerSchema: z.ZodObject<
  Pick<
    {
      id: z.ZodString
      organization_id: z.ZodString
      name: z.ZodString
      phone: z.ZodString
      email: z.ZodOptional<z.ZodString>
      active: z.ZodBoolean
      metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>
      created_at: z.ZodString
      updated_at: z.ZodString
    },
    'name' | 'phone' | 'email' | 'active' | 'metadata'
  > & {
    organization_id: z.ZodOptional<z.ZodString>
  },
  'strip',
  z.ZodTypeAny,
  {
    name: string
    phone: string
    active: boolean
    organization_id?: string | undefined
    email?: string | undefined
    metadata?: Record<string, unknown> | undefined
  },
  {
    name: string
    phone: string
    active: boolean
    organization_id?: string | undefined
    email?: string | undefined
    metadata?: Record<string, unknown> | undefined
  }
>
export declare const UpdateWorkerSchema: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>
    phone: z.ZodOptional<z.ZodString>
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>
    active: z.ZodOptional<z.ZodBoolean>
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>
    organization_id: z.ZodOptional<z.ZodOptional<z.ZodString>>
  },
  'strip',
  z.ZodTypeAny,
  {
    organization_id?: string | undefined
    name?: string | undefined
    phone?: string | undefined
    email?: string | undefined
    active?: boolean | undefined
    metadata?: Record<string, unknown> | undefined
  },
  {
    organization_id?: string | undefined
    name?: string | undefined
    phone?: string | undefined
    email?: string | undefined
    active?: boolean | undefined
    metadata?: Record<string, unknown> | undefined
  }
>
export declare const WorkerTokenSchema: z.ZodObject<
  {
    id: z.ZodString
    worker_id: z.ZodString
    token: z.ZodString
    expires_at: z.ZodString
    created_at: z.ZodString
    used_at: z.ZodOptional<z.ZodString>
    revoked: z.ZodBoolean
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string
    created_at: string
    worker_id: string
    token: string
    expires_at: string
    revoked: boolean
    used_at?: string | undefined
  },
  {
    id: string
    created_at: string
    worker_id: string
    token: string
    expires_at: string
    revoked: boolean
    used_at?: string | undefined
  }
>
export declare const DashboardStatsSchema: z.ZodObject<
  {
    totalWorkers: z.ZodNumber
    activeWorkers: z.ZodNumber
    totalSmsSent: z.ZodNumber
    totalSmsDelivered: z.ZodNumber
    recentActivity: z.ZodArray<
      z.ZodObject<
        {
          id: z.ZodString
          type: z.ZodEnum<['sms_sent', 'worker_created', 'worker_updated']>
          message: z.ZodString
          timestamp: z.ZodString
        },
        'strip',
        z.ZodTypeAny,
        {
          message: string
          type: 'sms_sent' | 'worker_created' | 'worker_updated'
          id: string
          timestamp: string
        },
        {
          message: string
          type: 'sms_sent' | 'worker_created' | 'worker_updated'
          id: string
          timestamp: string
        }
      >,
      'many'
    >
  },
  'strip',
  z.ZodTypeAny,
  {
    totalWorkers: number
    activeWorkers: number
    totalSmsSent: number
    totalSmsDelivered: number
    recentActivity: {
      message: string
      type: 'sms_sent' | 'worker_created' | 'worker_updated'
      id: string
      timestamp: string
    }[]
  },
  {
    totalWorkers: number
    activeWorkers: number
    totalSmsSent: number
    totalSmsDelivered: number
    recentActivity: {
      message: string
      type: 'sms_sent' | 'worker_created' | 'worker_updated'
      id: string
      timestamp: string
    }[]
  }
>
export declare const SmsMessageSchema: z.ZodObject<
  {
    id: z.ZodString
    worker_id: z.ZodString
    to: z.ZodString
    message: z.ZodString
    status: z.ZodEnum<['pending', 'sent', 'delivered', 'failed']>
    cost: z.ZodNumber
    provider_message_id: z.ZodOptional<z.ZodString>
    error_message: z.ZodOptional<z.ZodString>
    created_at: z.ZodString
    updated_at: z.ZodString
  },
  'strip',
  z.ZodTypeAny,
  {
    message: string
    status: 'pending' | 'sent' | 'delivered' | 'failed'
    id: string
    created_at: string
    updated_at: string
    worker_id: string
    to: string
    cost: number
    provider_message_id?: string | undefined
    error_message?: string | undefined
  },
  {
    message: string
    status: 'pending' | 'sent' | 'delivered' | 'failed'
    id: string
    created_at: string
    updated_at: string
    worker_id: string
    to: string
    cost: number
    provider_message_id?: string | undefined
    error_message?: string | undefined
  }
>
export declare const CreateSmsSchema: z.ZodObject<
  Pick<
    {
      id: z.ZodString
      worker_id: z.ZodString
      to: z.ZodString
      message: z.ZodString
      status: z.ZodEnum<['pending', 'sent', 'delivered', 'failed']>
      cost: z.ZodNumber
      provider_message_id: z.ZodOptional<z.ZodString>
      error_message: z.ZodOptional<z.ZodString>
      created_at: z.ZodString
      updated_at: z.ZodString
    },
    'message' | 'worker_id' | 'to'
  >,
  'strip',
  z.ZodTypeAny,
  {
    message: string
    worker_id: string
    to: string
  },
  {
    message: string
    worker_id: string
    to: string
  }
>
export declare const OrganizationSchema: z.ZodObject<
  {
    id: z.ZodString
    name: z.ZodString
    slug: z.ZodString
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>
    created_at: z.ZodString
    updated_at: z.ZodString
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string
    name: string
    created_at: string
    updated_at: string
    slug: string
    settings?: Record<string, unknown> | undefined
  },
  {
    id: string
    name: string
    created_at: string
    updated_at: string
    slug: string
    settings?: Record<string, unknown> | undefined
  }
>
export declare const CreateOrganizationSchema: z.ZodObject<
  Pick<
    {
      id: z.ZodString
      name: z.ZodString
      slug: z.ZodString
      settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>
      created_at: z.ZodString
      updated_at: z.ZodString
    },
    'name' | 'slug' | 'settings'
  >,
  'strip',
  z.ZodTypeAny,
  {
    name: string
    slug: string
    settings?: Record<string, unknown> | undefined
  },
  {
    name: string
    slug: string
    settings?: Record<string, unknown> | undefined
  }
>
export declare const PluginSchema: z.ZodObject<
  {
    id: z.ZodString
    name: z.ZodString
    description: z.ZodOptional<z.ZodString>
    version: z.ZodString
    enabled: z.ZodBoolean
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>
    created_at: z.ZodString
    updated_at: z.ZodString
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string
    name: string
    created_at: string
    updated_at: string
    version: string
    enabled: boolean
    settings?: Record<string, unknown> | undefined
    description?: string | undefined
  },
  {
    id: string
    name: string
    created_at: string
    updated_at: string
    version: string
    enabled: boolean
    settings?: Record<string, unknown> | undefined
    description?: string | undefined
  }
>
export declare const PaginationSchema: z.ZodObject<
  {
    page: z.ZodDefault<z.ZodNumber>
    limit: z.ZodDefault<z.ZodNumber>
  },
  'strip',
  z.ZodTypeAny,
  {
    page: number
    limit: number
  },
  {
    page?: number | undefined
    limit?: number | undefined
  }
>
export declare const WorkerQuerySchema: z.ZodObject<
  {
    page: z.ZodDefault<z.ZodNumber>
    limit: z.ZodDefault<z.ZodNumber>
  } & {
    search: z.ZodOptional<z.ZodString>
    active: z.ZodOptional<z.ZodBoolean>
    organization_id: z.ZodOptional<z.ZodString>
  },
  'strip',
  z.ZodTypeAny,
  {
    page: number
    limit: number
    organization_id?: string | undefined
    active?: boolean | undefined
    search?: string | undefined
  },
  {
    page?: number | undefined
    limit?: number | undefined
    organization_id?: string | undefined
    active?: boolean | undefined
    search?: string | undefined
  }
>
export declare const SmsQuerySchema: z.ZodObject<
  {
    page: z.ZodDefault<z.ZodNumber>
    limit: z.ZodDefault<z.ZodNumber>
  } & {
    worker_id: z.ZodOptional<z.ZodString>
    status: z.ZodOptional<z.ZodEnum<['pending', 'sent', 'delivered', 'failed']>>
    date_from: z.ZodOptional<z.ZodString>
    date_to: z.ZodOptional<z.ZodString>
  },
  'strip',
  z.ZodTypeAny,
  {
    page: number
    limit: number
    status?: 'pending' | 'sent' | 'delivered' | 'failed' | undefined
    worker_id?: string | undefined
    date_from?: string | undefined
    date_to?: string | undefined
  },
  {
    status?: 'pending' | 'sent' | 'delivered' | 'failed' | undefined
    page?: number | undefined
    limit?: number | undefined
    worker_id?: string | undefined
    date_from?: string | undefined
    date_to?: string | undefined
  }
>
export declare const ErrorSchema: z.ZodObject<
  {
    code: z.ZodString
    message: z.ZodString
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>
  },
  'strip',
  z.ZodTypeAny,
  {
    code: string
    message: string
    details?: Record<string, unknown> | undefined
  },
  {
    code: string
    message: string
    details?: Record<string, unknown> | undefined
  }
>
export declare const UuidSchema: z.ZodString
export declare const EmailSchema: z.ZodString
export declare const PhoneSchema: z.ZodString
export declare const UrlSchema: z.ZodString
export declare const DateTimeSchema: z.ZodString
//# sourceMappingURL=index.d.ts.map
