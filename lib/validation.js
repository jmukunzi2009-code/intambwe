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
  message: z.string().min(10, 'Message must be at least 10 characters').max(10000),
});

const mediaUrlValidator = z.string()
  .refine(
    (value) => !value || /^https?:\/\//i.test(value) || value.startsWith('data:') || (value.startsWith('/') && !value.startsWith('//')),
    'Must be a valid URL, local path, or data URI'
  )
  .optional()
  .or(z.literal(''))
  .nullable();

export const meetingSchema = z.object({
  meetingNumber: z.string().optional().nullable(),
  title: z.string().min(2, 'Title is required').max(250),
  theme: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  eventDate: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
  status: z.enum(['draft', 'published', 'registration_open', 'registration_closed', 'completed', 'cancelled']).default('published'),
  outcomes: z.string().optional().nullable(),
  recommendations: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  galleryUrls: z.array(
    z.string().refine((value) => !value || /^https?:\/\//i.test(value) || value.startsWith('data:') || (value.startsWith('/') && !value.startsWith('//')), 'Valid media required')
  ).optional().nullable(),
  coverImageUrl: mediaUrlValidator,
  videoUrl: mediaUrlValidator,
});

export const articleSchema = z.object({
  title: z.string().min(2, 'Title is required').max(300),
  slug: z.string().min(2, 'Slug is required'),
  categoryId: z.number().int().positive('Category is required'),
  introduction: z.string().optional().nullable(),
  content: z.string().min(5, 'Content is required'),
  learningObjectives: z.string().optional().nullable(),
  practicalExercises: z.string().optional().nullable(),
  criticalThinkingQuestions: z.string().optional().nullable(),
  reflectionActivity: z.string().optional().nullable(),
  readingTimeMinutes: z.number().int().min(1).default(5),
  sortOrder: z.number().int().min(0).default(1),
  status: z.enum(['draft', 'submitted', 'approved', 'published', 'suspended', 'rejected', 'archived']).default('published'),
  coverImageUrl: mediaUrlValidator,
  videoUrl: mediaUrlValidator,
  quizQuestion: z.string().optional().nullable(),
  quizOptions: z.any().optional().nullable(),
  quizCorrectIndex: z.number().int().min(0).max(10).optional().nullable(),
  quizExplanation: z.string().optional().nullable(),
});

export const resourceSchema = z.object({
  title: z.string().min(2, 'Title is required').max(300),
  description: z.string().optional().nullable(),
  fileType: z.enum(['pdf', 'guide', 'worksheet', 'presentation', 'video', 'audio', 'case_study', 'image', 'document']).default('pdf'),
  fileUrl: z.string().min(1, 'File URL or path is required'),
  fileSizeMb: z.number().optional().nullable(),
  isPublic: z.boolean().default(true),
  categoryId: z.number().int().positive().optional().nullable(),
  status: z.enum(['active', 'suspended']).default('active'),
});

export const categorySchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  slug: z.string().min(2, 'Slug is required').max(100),
  description: z.string().optional().nullable(),
  iconName: z.string().optional().nullable(),
  coverImageUrl: mediaUrlValidator,
  videoUrl: mediaUrlValidator,
  status: z.enum(['draft', 'published', 'archived']).default('published'),
});

export const journalSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  lessonReflected: z.string().optional().nullable(),
  reflectionContent: z.string().min(5, 'Reflection content must be at least 5 characters'),
  actionCommitment: z.string().optional().nullable(),
});
