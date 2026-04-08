/**
 * Worker Validation Schemas
 *
 * Zod schemas for worker data validation
 * Implements FR-002, FR-015, FR-016, FR-018, FR-019, FR-020
 */

import { z } from 'zod'
import { validateAustralianPhone } from '../utils/phone.js'

/**
 * Validate Australian mobile phone number
 * Must be E.164 format and valid AU mobile
 */
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .refine((phone) => validateAustralianPhone(phone), {
    message: 'Invalid Australian mobile number',
  })

/**
 * Worker name validation
 * FR-015: Required, 1-255 characters
 * FR-018: Supports Unicode (apostrophes, hyphens, accents)
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(255, 'Name must be 255 characters or less')
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, {
    message: 'Name cannot be empty',
  })

/**
 * Email validation (optional)
 */
export const emailSchema = z.string().email('Invalid email format').optional().or(z.literal(''))

/**
 * Create worker request schema
 */
export const createWorkerSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Update worker request schema
 * All fields optional except at least one must be provided
 */
export const updateWorkerSchema = z
  .object({
    name: nameSchema.optional(),
    phone: phoneSchema.optional(),
    email: emailSchema,
    active: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
    updatedAt: z.string().optional(), // For last-write-wins conflict detection
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  })

/**
 * Worker response schema
 */
export const workerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  organizationId: z.string().uuid(),
  active: z.boolean(),
  deletedAt: z.string().nullable(),
  metadata: z.record(z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CreateWorkerInput = z.infer<typeof createWorkerSchema>
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>
export type WorkerOutput = z.infer<typeof workerSchema>
