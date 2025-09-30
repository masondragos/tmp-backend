import { z } from 'zod';

export const loanProductSchema = z.object({
  loan_type: z.enum(['bridge_fix_and_flip', 'dscr_rental']),
  min_loan_amount: z.number().positive().optional(),
  max_loan_amount: z.number().positive().optional(),
  appraisal_required: z.boolean().default(true),
  appraisal_requirements: z.string().optional(),
  citizen_requirements: z.array(z.string()).default([]),
  seasoning_period_months: z.number().int().nonnegative().optional(),
  states_funded: z.array(z.string()).default([]),
  min_credit_score: z.number().int().min(300).max(850).optional(),
  max_ltv_percentage: z.number().positive().max(100).optional(),
  accepts_rehab_loans: z.boolean().default(false),
});

export const loanProductUpdateSchema = loanProductSchema.partial();

export type LoanProduct = z.infer<typeof loanProductSchema>;
export type LoanProductUpdate = z.infer<typeof loanProductUpdateSchema>;
