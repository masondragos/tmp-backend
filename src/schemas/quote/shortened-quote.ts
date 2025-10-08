import z from "zod";

export const newTermsSheetSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  credit_score: z.string().min(1, "Credit score is required"),
  loan_type: z.string().min(1, "Loan type is required"),
  property_address: z.string().min(1, "Property address is required"),
  property_state: z.string().min(1, "Property state is required"),
  property_type: z.string().min(1, "Property type is required"),
  purchase_price: z.string().min(1, "Purchase price is required"),
  rehab_amount_requested: z.string().min(1, "Rehab amount is required"),
  after_repair_property_value: z
    .string()
    .min(1, "After repair value is required"),
  requested_loan_amount: z.string().min(1, "Requested loan amount is required"),
  user_id: z.number().min(1, "User ID is required"),
  monthly_rental_income: z.string().optional(),
  annual_property_insurance: z.string().optional(),
  annual_property_taxes: z.string().optional(),
  monthly_hoa_fee: z.string().optional(),
});

// export const getNewTermsSheetSchema = (
//   loan_type: "bridge_fix_and_flip" | "dscr_rental"
// ) => {
//   //   let schemaToReturn = newTermsSheetSchema;
//   if (loan_type === "dscr_rental") {
//     return newTermsSheetSchema.extend({
//       monthly_rental_income: z
//         .string()
//         .min(1, "Monthly rental income is required"),
//       annual_property_insurance: z
//         .string()
//         .min(1, "Annual property insurance is required"),
//       annual_property_taxes: z
//         .string()
//         .min(1, "Annual property taxes is required"),
//       monthly_hoa_fee: z.string().min(1, "Monthly HOA fee is required"),
//     });
//     // return schemaToReturn;
//   } else {
//     return newTermsSheetSchema;
//   }
// };
