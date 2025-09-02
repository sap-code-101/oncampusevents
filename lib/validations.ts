import { z } from 'zod'

// Auth validation schemas
export const signUpSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .refine((email) => {
      // Check if email ends with .edu or contains .edu.
      return email.endsWith('.edu') || email.includes('.edu.')
    }, 'Please use a valid university email address (.edu)'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password is too long'),
  confirmPassword: z.string(),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters long')
    .max(100, 'Full name is too long'),
  universityId: z.string().min(1, 'Please select your university'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Club validation schemas
export const clubSchema = z.object({
  name: z
    .string()
    .min(2, 'Club name must be at least 2 characters long')
    .max(100, 'Club name is too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters long')
    .max(500, 'Description is too long'),
  category: z.string().min(1, 'Please select a category'),
  logoUrl: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
})

// Event validation schemas
export const eventSchema = z.object({
  title: z
    .string()
    .min(2, 'Event title must be at least 2 characters long')
    .max(100, 'Event title is too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters long')
    .max(1000, 'Description is too long'),
  date: z.string().refine((date) => {
    const eventDate = new Date(date)
    const now = new Date()
    return eventDate > now
  }, 'Event date must be in the future'),
  location: z
    .string()
    .min(2, 'Location must be at least 2 characters long')
    .max(200, 'Location is too long'),
  bannerUrl: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  clubId: z.string().min(1, 'Please select a club'),
})

// Search and filter schemas
export const searchSchema = z.object({
  search: z.string().optional(),
  university: z.string().optional(),
  dateFilter: z.enum(['upcoming', 'today', 'this-week', 'past']).optional(),
  category: z.string().optional(),
})





export type ClubSchemaType = z.infer<typeof clubSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type ClubInput = z.infer<typeof clubSchema>
export type EventInput = z.infer<typeof eventSchema>
export type SearchInput = z.infer<typeof searchSchema>