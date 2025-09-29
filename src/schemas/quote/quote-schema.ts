import { z } from "zod";

// Enums
export const LoanTypeEnum = z.enum(["bridge_fix_and_flip", "dscr_rental"]);

// Full Quote schema (matches Prisma model types)
export const quoteSchema = z.object({
  address: z.string(),
  is_living_in_property: z.boolean(),
  loan_type: LoanTypeEnum,
  user_id: z.number().int(),
});
export const quoteUpdateSchema = z.object({
  address: z.string(),
  is_living_in_property: z.boolean(),
  loan_type: LoanTypeEnum,
});



