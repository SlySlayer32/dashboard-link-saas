import { parsePhoneNumber, type CountryCode } from 'libphonenumber-js'
import { z } from 'zod'

// Phone number validation using libphonenumber-js
const phoneNumberSchema = z.string().refine(
  (phone) => {
    try {
      const parsed = parsePhoneNumber(phone, 'AU' as CountryCode)
      return parsed.isValid()
    } catch {
      return false
    }
  },
  { message: 'Invalid phone number format. Must be in E.164 format (e.g., +61412345678)' }
)

// Create Worker Schema
export const CreateWorkerSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  phone_number: phoneNumberSchema,
  calendar_email: z.string().email('Invalid email format').optional(),
})

// Update Worker Schema
export const UpdateWorkerSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  phone_number: phoneNumberSchema.optional(),
  calendar_email: z.string().email().optional(),
})

// Validate and format phone number to E.164
export function validateAndFormatPhone(phone: string, defaultCountry: CountryCode = 'AU'): string {
  try {
    const parsed = parsePhoneNumber(phone, defaultCountry)
    if (!parsed.isValid()) {
      throw new Error('Invalid phone number')
    }
    return parsed.format('E.164')
  } catch (error) {
    throw new Error(
      `Invalid phone number format: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
