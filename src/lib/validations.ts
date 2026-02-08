import { z } from 'zod';

// Esquemas de validação

export const concelhoSearchSchema = z.object({
  query: z.string().min(1).max(100),
});

export const programSearchSchema = z.object({
  concelho: z.string().optional(),
  measures: z.array(z.string()).optional(),
  supportTypes: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

export const eligibilityCheckSchema = z.object({
  concelhoId: z.string(),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'TOWNHOUSE', 'OTHER']),
  ownershipType: z.enum(['OWNER', 'TENANT', 'USUFRUCT', 'OTHER']),
  buildingYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  householdSize: z.number().int().positive().optional(),
  annualIncome: z.number().positive().optional(),
  socialTariff: z.boolean().optional(),
  desiredMeasures: z.array(z.string()).optional(),
});

export const houseSchema = z.object({
  name: z.string().max(100).optional(),
  concelhoId: z.string(),
  freguesiaId: z.string().optional(),
  address: z.string().max(255).optional(),
  postalCode: z.string().regex(/^\d{4}-\d{3}$/).optional(),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'TOWNHOUSE', 'OTHER']),
  ownershipType: z.enum(['OWNER', 'TENANT', 'USUFRUCT', 'OTHER']),
  buildingYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  area: z.number().positive().optional(),
  energyClass: z.enum(['A_PLUS', 'A', 'B', 'B_MINUS', 'C', 'D', 'E', 'F', 'G']).optional(),
  householdSize: z.number().int().positive().optional(),
  annualIncome: z.number().positive().optional(),
  socialTariff: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(100).optional(),
  nif: z.string().regex(/^\d{9}$/).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(8).max(100),
});

// Tipos derivados dos schemas
export type ConcelhoSearchInput = z.infer<typeof concelhoSearchSchema>;
export type ProgramSearchInput = z.infer<typeof programSearchSchema>;
export type EligibilityCheckInput = z.infer<typeof eligibilityCheckSchema>;
export type HouseInput = z.infer<typeof houseSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
