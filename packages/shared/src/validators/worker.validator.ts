import { z } from 'zod'
import { formatAustralianPhone } from '../utils/phone.js'

// Phone number validation using formatAustralianPhone from utils/phone.ts
const phoneNumberSchema = z.string().refine(
  (phone) => {
    try {
      formatAustralianPhone(phone)
      return true
    } catch {
      return false
    }
  },
  { message: 'Invalid Australian mobile phone number' }
)

// Create Worker Schema
export const CreateWorkerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  phone: phoneNumberSchema,
  email: z.string().email('Invalid email format').optional(),
})

// Update Worker Schema
export const UpdateWorkerSchema = z.object({
  name: z.string().min(1).max(255, 'Name must be 255 characters or less').optional(),
  phone: phoneNumberSchema.optional(),
  email: z.string().email().optional(),
})
