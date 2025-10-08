import z from "zod";
import { CitizenshipRequirement } from "@prisma/client";
import { AppraisalType } from "@prisma/client";

const createLoanProductSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().optional(),
    // Criteria fields
    max_loan_amount: z.number().positive(),
    min_loan_amount: z.number().positive(),
    citizenship_requirement: z.enum(Object.values(CitizenshipRequirement) as [CitizenshipRequirement, ...CitizenshipRequirement[]]),
    seasoning_period_months: z.number().int().min(0),
    appraisal_required: z.boolean(),
    appraisal_type: z.enum(Object.values(AppraisalType) as [AppraisalType, ...AppraisalType[]]),
    states_funded: z.array(z.string()),
  });
const createLoanProductSchemaWithUpraisalOptional = z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().optional(),
    // Criteria fields
    max_loan_amount: z.number().positive(),
    min_loan_amount: z.number().positive(),
    citizenship_requirement: z.enum(Object.values(CitizenshipRequirement) as [CitizenshipRequirement, ...CitizenshipRequirement[]]),
    seasoning_period_months: z.number().int().min(0),
    appraisal_required: z.boolean(),
    appraisal_type: z.enum(Object.values(AppraisalType) as [AppraisalType, ...AppraisalType[]]).optional(),
    states_funded: z.array(z.string()),
  });

export const getCreateUpdateLoanProductSchema = (appraisal_required: boolean)=>{
    if(appraisal_required){
        return createLoanProductSchema;
    }else{
        return createLoanProductSchemaWithUpraisalOptional
    }

}