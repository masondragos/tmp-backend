import { z } from "zod";

// Base applicant info schema with common fields
export const applicantSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  citizenship: z.string("Required").min(1, "Citizenship is required"),
  company_ein: z
    .string().min(1, "Company EIN is required"),
  company_name: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name must be less than 100 characters"),
  liquid_funds_available: z
    .string().min(1, "Liquid funds available is required"),
  credit_score: z
    .number()
    .int()
    .min(300, "Credit score must be at least 300")
    .max(850, "Credit score must be at most 850"),
  phone_number: z.string().min(1, "Phone number is required"),
  properties_owned: z
    .number()
    .int()
    .min(0, "Properties owned must be non-negative"),
  company_state: z.string("Required").min(1, "Company state is required"),
  quote_id: z.number().int(),
});

export const getApplicantInfoSchema = (properties_owned: string) => {
  if (String(properties_owned) === "0") {
    return applicantSchema;
  } else {
   const updatedApplicantSchema = applicantSchema.extend({
      total_equity_value: z
        .string("Required").min(1, "Total equity value is required"),
        total_debt_value: z
        .string("Required").min(1, "Total debt value is required"),
    });
    return updatedApplicantSchema;
  }
};
