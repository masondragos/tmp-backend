import z from "zod";

export const rentalInfoSchema = z.object({
    loan_amount: z.string().min(1, "Loan amount is required"),
    monthly_rental_income: z.string().min(1, "Monthly rental income is required"),
    annual_property_insurance: z.string().optional(),
    annual_property_taxes: z.string().optional(),
    monthly_hoa_fee: z.string().optional(),
    quote_id: z.number().int(),
  });
  