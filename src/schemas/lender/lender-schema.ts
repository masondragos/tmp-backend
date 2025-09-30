import { z } from 'zod';

export const lenderRegistrationSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  contact_name: z.string().optional(),
  phone_number: z.string().optional(),
});

export const lenderLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const lenderUpdateSchema = z.object({
  company_name: z.string().min(1).optional(),
  contact_name: z.string().optional(),
  phone_number: z.string().optional(),
});

export type LenderRegistration = z.infer<typeof lenderRegistrationSchema>;
export type LenderLogin = z.infer<typeof lenderLoginSchema>;
export type LenderUpdate = z.infer<typeof lenderUpdateSchema>;
