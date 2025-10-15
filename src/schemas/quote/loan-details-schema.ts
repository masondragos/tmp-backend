import { z } from "zod";

// Enums to match Prisma
export const ExitPlanEnum = z.enum(["refinance", "sell"]);

export const fixAndFlipLoanDetailsSchema = z.object({
  purpose_of_loan: z.string(),
  purchase_price: z.string().min(1, "Purchase price is required"),
  contract_close_date: z.string().min(1, "Contract close date is required"),
  // as_is_property_value: z.string().min(1, "As-Is property value is required"),
  has_rehab_funds_requested: z.boolean(),
  after_repair_property_value: z
    .string()
    .min(1, "After repair property value is required"),
  exit_plan: ExitPlanEnum,
  // seller_concessions: z.string().min(1, "Seller concessions is required"),
  // assignment_fees: z.string().min(1, "Assignment fees is required"),
  completed_fix_and_flips_2_years: z
    .string()
    .min(1, "Completed fix & flips in last 2 years is required"),
  quote_id: z.number().int(),
});

export const fixAndFlipsLoanDetailsNewPurchaseSchema = z.object({
  purpose_of_loan: z.string(),
  purchase_price: z.string().min(1, "Purchase price is required"),
  contract_close_date: z.string().min(1, "Contract close date is required"),
  after_repair_property_value: z
    .string()
    .min(1, "After repair property value is required"),
  exit_plan: ExitPlanEnum,
  completed_fix_and_flips_2_years: z
    .string()
    .min(1, "Completed fix & flips in last 2 years is required"),
  as_is_property_value: z.string().min(1, "As-Is property value is required"),
  has_rehab_funds_requested: z.boolean().default(false),
  seller_concessions: z.number().int().optional(),
  assignment_fees: z.number().int().optional(),
  quote_id: z.number().int(),
});

export const fixAndFlipsLoanDetailsRefinanceSchema = z.object({
  purpose_of_loan: z.string(),
  purchase_price: z.string().min(1, "Purchase price is required"),
  as_is_property_value: z.string().min(1, "As-Is property value is required"),
  required_close_date: z.string().min(1, "Required close date is required"),
  has_rehab_funds_requested: z.boolean().default(false),
  after_repair_property_value: z
    .string()
    .min(1, "After repair property value is required"),
  exit_plan: ExitPlanEnum,
  completed_fix_and_flips_2_years: z
    .string()
    .min(1, "Completed fix & flips in last 2 years is required"),
  funding_reason: z.string().min(1, "Funding reason is required"),
  quote_id: z.number().int(),
});

export type FixAndFlipLoanDetailsFormData = z.infer<
  ReturnType<typeof getFixAndFlipLoanDetailsSchema>
>;

export const getFixAndFlipLoanDetailsSchema = (
  purpose_of_loan: string,
  has_rehab_funds_requested: string
) => {
  if (purpose_of_loan === "purchase") {
    if (has_rehab_funds_requested === "Yes") {
      return fixAndFlipsLoanDetailsNewPurchaseSchema.extend({
        rehab_amount_requested: z
          .string()
          .min(1, "Rehab amount requested is required"),
      });
    }
    return fixAndFlipsLoanDetailsNewPurchaseSchema;
  } else if (purpose_of_loan === "refinance") {
    if (has_rehab_funds_requested === "Yes") {
      return fixAndFlipsLoanDetailsRefinanceSchema.extend({
        rehab_amount_requested: z
          .string()
          .min(1, "Rehab amount requested is required"),
      });
    }
    return fixAndFlipsLoanDetailsRefinanceSchema;
  }
  return fixAndFlipsLoanDetailsNewPurchaseSchema;
};

export type GetFixAndFlipLoanDetailsFormData = z.infer<
  ReturnType<typeof getFixAndFlipLoanDetailsSchema>
>;
// DSCR loan details schema

export const dscrNewPurchaseFormSchema = z.object({
  purpose_of_loan: z.string(),
  purchase_price: z.string().min(1, "Purchase price is required"),
  contract_close_date: z.string().min(1, "Contract close date is required"),
  // has_rehab_funds_requested: z.boolean().default(false),
  has_tenant: z.boolean().default(false),
  quote_id: z.number().int(),
});

export const dscrRefinanceNoCashFormSchema = z.object({
  purpose_of_loan: z.string(),
  purchase_price: z.string().min(1, "Purchase price is required"),
  property_purchase_date: z
    .string()
    .min(1, "Property purchase date is required"),
  mortgage_remaining: z.string().min(1, "Mortgage remaining is required"),
  has_completed_any_rehab: z.boolean().default(false),
  has_tenant: z.boolean().default(false),
  quote_id: z.number().int(),
});

export const dscrRefinanceCashOutFormSchema = z.object({
  purpose_of_loan: z.string(),
  purchase_price: z.string().min(1, "Purchase price is required"),
  property_purchase_date: z
    .string()
    .min(1, "Property purchase date is required"),
  mortgage_remaining: z.string().min(1, "Mortgage remaining is required"),
  current_property_value: z
    .string()
    .min(1, "Current property value is required"),
  requested_loan_amount: z.string().min(1, "Requested loan amount is required"),
  has_completed_any_rehab: z.boolean().default(false),
  has_tenant: z.boolean().default(false),
  quote_id: z.number().int(),
});

export const getDSCRLoanDetailsSchema = ({
  purpose_of_loan,
  has_completed_any_rehab,
  has_tenant,
}: {
  purpose_of_loan: string;
  has_completed_any_rehab: boolean;
  has_tenant: boolean;
}) => {
  if (purpose_of_loan === "purchase") {
    let schemaToReturn = dscrNewPurchaseFormSchema;
    // if (has_rehab_funds_requested) {
    //   schemaToReturn = schemaToReturn.extend({
    //     what_needs_to_be_done: z.string().min(1, "What needs to be done is required"),
    //     how_will_you_fund_this: z.string().min(1, "How will you fund this is required"),
    //   });
    // }
    if (has_tenant) {
      schemaToReturn = schemaToReturn.extend({
        how_much_are_they_paying: z
          .string()
          .min(1, "How much are they paying is required"),
        has_signed_lease: z.boolean(),
        has_paid_rent_last_3_months: z.boolean(),
      });
    } else {
      schemaToReturn = schemaToReturn.extend({
        market_rent: z.string().min(1, "Market rent is required"),
      });
    }
    return schemaToReturn;
  } else if (purpose_of_loan === "refinance-no-cash") {
    let schemaToReturn = dscrRefinanceNoCashFormSchema;
    if (has_completed_any_rehab) {
      schemaToReturn = schemaToReturn.extend({
        how_much_was_spent_on_rehab: z
          .string()
          .min(1, "How much was spent on rehab is required"),
        what_was_done_on_rehab: z
          .string()
          .min(1, "What was done on rehab is required"),
      });
    }
    if (has_tenant) {
      schemaToReturn = schemaToReturn.extend({
        how_much_are_they_paying: z
          .string()
          .min(1, "How much are they paying is required"),
        has_signed_lease: z.boolean(),
        has_paid_rent_last_3_months: z.boolean(),
      });
    } else {
      schemaToReturn = schemaToReturn.extend({
        market_rent: z.string().min(1, "Market rent is required"),
      });
    }
    return schemaToReturn;
  } else {
    let schemaToReturn = dscrRefinanceCashOutFormSchema;
    if (has_completed_any_rehab) {
      schemaToReturn = schemaToReturn.extend({
        how_much_was_spent_on_rehab: z
          .string()
          .min(1, "How much was spent on rehab is required"),
        what_was_done_on_rehab: z
          .string()
          .min(1, "What was done on rehab is required"),
      });
    }
    if (has_tenant) {
      schemaToReturn = schemaToReturn.extend({
        how_much_are_they_paying: z
          .string()
          .min(1, "How much are they paying is required"),
        has_signed_lease: z.boolean(),
        has_paid_rent_last_3_months: z.boolean(),
      });
    } else {
      schemaToReturn = schemaToReturn.extend({
        market_rent: z.string().min(1, "Market rent is required"),
      });
    }
    return schemaToReturn;
  }
};
