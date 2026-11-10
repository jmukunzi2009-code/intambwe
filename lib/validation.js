import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must match'),
  school: z.string().min(2, 'School name is required'),
  classLevel: z.string().min(1, 'Education level or class is required'),
  country: z.string().default('Rwanda'),
  preferredLanguage: z.string().default('English'),
  phone: z.string().optional().nullable(),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms and privacy policy' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional().nullable(),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(150),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

export const meetingSchema = z.object({
  meetingNumber: z.string().min(2, 'Meeting number is required'),
  title: z.string().min(3, 'Title is required').max(200),
  theme: z.string().min(3, 'Theme is required').max(250),
  description: z.string().min(10, 'Description is required'),
  eventDate: z.string().min(1, 'Event date is required'),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  venue: z.string().min(2, 'Venue is required'),
  capacity: z.number().int().positive().optional().nullable(),
  status: z.enum(['draft', 'published', 'registration_open', 'registration_closed', 'completed', 'cancelled']).default('draft'),
  outcomes: z.string().optional().nullable(),
  recommendations: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  coverImageUrl: z.string()
    .max(2048)
    .refine((value) => !value || /^https?:\/\//i.test(value) || (value.startsWith('/') && !value.startsWith('//')), 'Image must be an HTTP(S) URL or a local media path')
    .optional()
    .or(z.literal(''))
    .nullable(),
  videoUrl: z.string()
    .max(2048)
    .refine((value) => !value || /^https?:\/\//i.test(value) || (value.startsWith('/') && !value.startsWith('//')), 'Video must be an HTTP(S) URL or a local media path')
    .optional()
    .or(z.literal(''))
    .nullable(),
});

export const articleSchema = z.object({
  title: z.string().min(3, 'Title is required').max(200),
  slug: z.string().min(3, 'Slug is required'),
  categoryId: z.number().int().positive('Category is required'),
  introduction: z.string().min(10, 'Introduction is required'),
  content: z.string().min(20, 'Content is required'),
  learningObjectives: z.string().optional().nullable(),
  practicalExercises: z.string().optional().nullable(),
  criticalThinkingQuestions: z.string().optional().nullable(),
  reflectionActivity: z.string().optional().nullable(),
  readingTimeMinutes: z.number().int().min(1).default(5),
  status: z.enum(['draft', 'submitted', 'approved', 'published', 'rejected', 'archived']).default('draft'),
  coverImageUrl: z.string()
    .max(2048)
    .refine((value) => !value || /^https?:\/\//i.test(value) || (value.startsWith('/') && !value.startsWith('//')), 'Image must be an HTTP(S) URL or a local media path')
    .optional()
    .or(z.literal(''))
    .nullable(),
  videoUrl: z.string()
    .max(2048)
    .refine((value) => !value || /^https?:\/\//i.test(value) || (value.startsWith('/') && !value.startsWith('//')), 'Video must be an HTTP(S) URL or a local media path')
    .optional()
    .or(z.literal(''))
    .nullable(),
});

export const resourceSchema = z.object({
  title: z.string().min(3, 'Title is required').max(200),
  description: z.string().min(10, 'Description is required'),
  fileType: z.enum(['pdf', 'guide', 'worksheet', 'presentation', 'video', 'audio', 'case_study']).default('pdf'),
  fileUrl: z.string().min(1, 'File URL or path is required'),
  fileSizeMb: z.number().optional().nullable(),
  isPublic: z.boolean().default(true),
  categoryId: z.number().int().positive().optional().nullable(),
});

export const journalSchema = z.object({
  title: z.string().min(2, 'Title is required').max(150),
  lessonReflected: z.string().optional().nullable(),
  reflectionContent: z.string().min(10, 'Reflection content must be at least 10 characters'),
  actionCommitment: z.string().optional().nullable(),
});
