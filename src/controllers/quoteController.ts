import { Request, Response } from "express";
import { PrismaClient, QuoteStatus } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { emailService } from '../services/emailService';
import { PaginationService } from '../utils/pagination';
import { quoteSchema, quoteUpdateSchema } from "../schemas/quote/quote-schema";
import {
  applicantSchema,
  getApplicantInfoSchema,
} from "../schemas/quote/quote-applicant-info";
import {
  getDSCRLoanDetailsSchema,
  getFixAndFlipLoanDetailsSchema,
} from "../schemas/quote/loan-details-schema";
import { prioritiesSchema } from "../schemas/quote/priorities-schema";
import { rentalInfoSchema } from "../schemas/quote/rental-info-schema";
import { newTermsSheetSchema } from "../schemas/quote/shortened-quote";

const prisma = new PrismaClient().$extends(withAccelerate());
// Step till signin/signup
export const createQuote = async (req: Request, res: Response) => {
  console.log("Calling create quote")
  try {
  const body = quoteSchema.safeParse(req.body);
  if (!body.success) {
      return res.status(400).json({ error: body.error.message })  ;
  }
    
  const quote = await prisma.quote.create({
      data: { ...body.data, active_step: "applicant_info" },
  });
  res.status(201).json(quote);
  } catch (error) {
    console.error("Error creating quote:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getQuote = async (req: Request, res: Response) => {
  try {
  const quote = await prisma.quote.findUnique({
    where: { id: parseInt(req.params.id) },
  });
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }
  res.status(200).json(quote);
  } catch (error) {
    console.error("Error getting quote:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllQuotes = async (req: Request, res: Response) => {
  try {
    // Get user ID from JWT token (set by verifyJWT middleware)
    const userId = (req as any).user?.id;
    const status = req.query.status as string;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Create where clause with user filter and status filter
    const where: any = { user_id: parseInt(userId) };
    if (status) {
      if(status === "submitted"){
        where.is_draft = false;
      }
      if(status === "draft"){
        where.is_draft = true;
      }
    }

    const result = await PaginationService.paginate(
      prisma.quote,
      req,
      {
        pagination: {
          page: req.query.page as string,
          limit: req.query.limit as string,
        },
        search: {
          search: req.query.search as string,
          searchFields: ['address']
        },
        where,
        orderBy: { created_at: 'desc' },
        include: {
          quoteApplicantInfo: true,
          quoteLoanDetails: true,
          quoteRentalInfo: true,
          quotePriorities: true,
        }
      }
    );

    // Get total quotes for user (regardless of filters)
    const totalForUser = await prisma.quote.count({ 
      where: { user_id: parseInt(userId) } 
    });

    res.status(200).json({
      ...result,
      meta: {
        ...result.meta,
        total_for_user: totalForUser,
      }
    });
  } catch (error) {
    console.error("Error getting all quotes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getQuotesCountByStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const [quotesCountByDraft, totalCount] = await Promise.all([
      prisma.quote.groupBy({
        by: ['is_draft'],
        where: { user_id: parseInt(userId) },
        _count: { _all: true },
      }),
      prisma.quote.count({ where: { user_id: parseInt(userId) } })
    ]);
    
    const draftCounts = quotesCountByDraft.reduce((acc: Record<string, number>, row: any) => {
      const key = row.is_draft === true ? 'draft' : 'final';
      acc[key] = row._count._all;
      return acc;
    }, {});
    
    res.status(200).json({
      ...draftCounts,
      total: totalCount
    });
  } catch (error) {
    console.error("Error getting quotes count by status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
export const updateQuote = async (req: Request, res: Response) => {
  try {
    const body = quoteUpdateSchema.safeParse(req.body);
    if (!body.success) {
        return res.status(400).json({ error: body.error.message });
    }
  const quote = await prisma.quote.update({
    where: { id: parseInt(req.params.id) },
    data: { ...body.data },
  });
  res.status(200).json(quote);
  } catch (error) {
    console.error("Error updating quote:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Quote applicant info

export const createQuoteApplicantInfo = async (req: Request, res: Response) => {
  try {
    const properties_owned = req.body?.properties_owned;
    console.log('properties_owned', properties_owned);
    if (!String(properties_owned)) {
      return res.status(400).json({ error: "Properties owned is required" });
    }
    const body = getApplicantInfoSchema(properties_owned).safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: body.error.message });
  }
  const quoteApplicantInfo = await prisma.quote_Applicant_Info.create({
    data: { ...body.data },
  });
  res.status(201).json(quoteApplicantInfo);
  } catch (error) {
    console.error("Error creating quote applicant info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getQuoteApplicantInfo = async (req: Request, res: Response) => {
  try {
    const quoteApplicantInfo = await prisma.quote_Applicant_Info.findUnique({
      where: { quote_id: parseInt(req.params.id) },
    });
    if (!quoteApplicantInfo) {
      return res.status(404).json({ error: "Quote applicant info not found" });
    }
    res.status(200).json(quoteApplicantInfo);
  } catch (error) {
    console.error("Error getting quote applicant info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateQuoteApplicantInfo = async (req: Request, res: Response) => {
  try {
    const properties_owned = req.body?.properties_owned;
    if (!String(properties_owned)) {
      return res.status(400).json({ error: "Properties owned is required" });
    }
    const body = getApplicantInfoSchema(properties_owned).safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }
    const quoteApplicantInfo = await prisma.quote_Applicant_Info.update({
      where: { quote_id: parseInt(req.params.id) },
      data: { ...body.data },
    });
    res.status(200).json(quoteApplicantInfo);
  } catch (error) {
    console.error("Error updating quote applicant info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Quote loan details

export const createQuoteLoanDetails = async (req: Request, res: Response) => {
  try {
    const { purpose_of_loan, has_rehab_funds_requested, quote_id, has_tenant } =
      req.body;
    const quoteId = parseInt(quote_id);
    const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include:{quoteApplicantInfo:true} });
    if (!quote) {
      return res.status(400).json({ error: "Quote not found" });
    }
    if (quote.loan_type === "bridge_fix_and_flip") {
      const body = getFixAndFlipLoanDetailsSchema(
        purpose_of_loan,
        has_rehab_funds_requested
      ).safeParse(req.body);
      if (!body.success) {
        return res.status(400).json({ error: body.error.message });
      }
      const quoteLoanDetails = await prisma.quote_Loan_Details.create({
        data: { ...body.data, quote_id: quoteId },
      });
      return res.status(201).json(quoteLoanDetails);
    } else if (quote.loan_type === "dscr_rental") {
      const body = getDSCRLoanDetailsSchema({
        purpose_of_loan,
        has_rehab_funds_requested,
        has_tenant,
      }).safeParse(req.body);
      if (!body.success) {
        return res.status(400).json({ error: body.error.message });
      }
      const quoteLoanDetails = await prisma.quote_Loan_Details.create({
        data: { ...body.data, quote_id: quoteId },
      });
      return res.status(201).json(quoteLoanDetails);
    }
  } catch (error) {
    console.error("Error creating quote loan details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateQuoteLoanDetails = async (req: Request, res: Response) => {
  try {
    const { purpose_of_loan, has_rehab_funds_requested, quote_id, has_tenant } =
      req.body;
    const quoteId = parseInt(quote_id);
    const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include:{quoteApplicantInfo:true} });
    if (!quote) {
      return res.status(400).json({ error: "Quote not found" });
    }
    if (quote.loan_type === "bridge_fix_and_flip") {
      const body = getFixAndFlipLoanDetailsSchema(
        purpose_of_loan,
        has_rehab_funds_requested
      ).safeParse(req.body);
      if (!body.success) {
        return res.status(400).json({ error: body.error.message });
      }
      const quoteLoanDetails = await prisma.quote_Loan_Details.update({
        where: { quote_id: quoteId },
        data: { ...body.data },
      });
      return res.status(200).json(quoteLoanDetails);
    } else {
      const body = getDSCRLoanDetailsSchema({
        purpose_of_loan,
        has_rehab_funds_requested,
        has_tenant,
      }).safeParse(req.body);
      if (!body.success) {
        return res.status(400).json({ error: body.error.message });
      }
      const quoteLoanDetails = await prisma.quote_Loan_Details.update({
        where: { quote_id: quoteId },
        data: { ...body.data },
      });
      return res.status(200).json(quoteLoanDetails);
    }
  } catch (error) {
    console.error("Error updating quote loan details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getQuoteLoanDetails = async (req: Request, res: Response) => {
  try {
    const quoteLoanDetails = await prisma.quote_Loan_Details.findUnique({
      where: { quote_id: parseInt(req.params.id) },
    });
    if (!quoteLoanDetails) {
      return res.status(404).json({ error: "Quote loan details not found" });
    }
    res.status(200).json(quoteLoanDetails);
  } catch (error) {
    console.error("Error getting quote loan details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Quote rental info

export const createQuotePriorities = async (req: Request, res: Response) => {
  try {
    const body = prioritiesSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }
    const quote = await prisma.quote.findUnique({
      where: { id: body.data.quote_id },
    });
    if (!quote) {
      return res.status(400).json({ error: "Quote not found" });
    }
    const quotePriorities = await prisma.quote_Priorities.create({
      data: { ...body.data },
    });
    if(quote.loan_type === "bridge_fix_and_flip") {
      await prisma.quote.update({
        where: { id: body.data.quote_id },
        data: { is_draft: false, status: "awaiting" },
      });
    }
    return res.status(201).json(quotePriorities);
  } catch (error) {
    console.error("Error creating quote priorities:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getQuotePriorities = async (req: Request, res: Response) => {
  try {
    const quotePriorities = await prisma.quote_Priorities.findUnique({
      where: { quote_id: parseInt(req.params.id) },
    });
    if (!quotePriorities) {
      return res.status(404).json({ error: "Quote priorities not found" });
    }
    res.status(200).json(quotePriorities);
  } catch (error) {
    console.error("Error getting quote priorities:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const updateQuotePriorities = async (req: Request, res: Response) => {
  try {
    const body = prioritiesSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }
    const quoteId = parseInt(req.params.id);
    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) {
      return res.status(400).json({ error: "Quote not found" });
    }
    const quotePriorities = await prisma.quote_Priorities.update({
      where: { quote_id: quoteId },
      data: { ...body.data },
    });
    return res.status(200).json(quotePriorities);
  } catch (error) {
    console.error("Error updating quote priorities:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Rental Info
export const createQuoteRentalInfo = async (req: Request, res: Response) => {
  try {
    const body = rentalInfoSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }
    const quote = await prisma.quote.findUnique({
      where: { id: body.data.quote_id },
    });
    if (!quote) {
      return res.status(400).json({ error: "Quote not found" });
    }
    const quoteRentalInfo = await prisma.quote_Rental_Info.create({
      data: { ...body.data },
    });
    await prisma.quote.update({
      where: { id: body.data.quote_id },
      data: { is_draft: false, status: "awaiting" },
    });
    return res.status(201).json(quoteRentalInfo);
  } catch (error) {
    console.error("Error creating quote rental info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getQuoteRentalInfo = async (req: Request, res: Response) => {
  try {
    const quoteRentalInfo = await prisma.quote_Rental_Info.findUnique({
      where: { quote_id: parseInt(req.params.id) },
    });
    if (!quoteRentalInfo) {
      return res.status(404).json({ error: "Quote rental info not found" });
    }
    res.status(200).json(quoteRentalInfo);
  } catch (error) {
    console.error("Error getting quote rental info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const updateQuoteRentalInfo = async (req: Request, res: Response) => {
  try {
    const body = rentalInfoSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }
    const quote = await prisma.quote.findUnique({
      where: { id: body.data.quote_id },
    });
    if (!quote) {
      return res.status(400).json({ error: "Quote not found" });
    }
    const quoteRentalInfo = await prisma.quote_Rental_Info.update({
      where: { quote_id: body.data.quote_id },
      data: { ...body.data },
    });
    return res.status(200).json(quoteRentalInfo);
  } catch (error) {
    console.error("Error updating quote rental info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Getting a quote as a whole

export const getQuoteAsWhole = async (req: Request, res: Response) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        quoteApplicantInfo: true,
        quoteLoanDetails: true,
        quoteRentalInfo: true,
        quotePriorities: true,
      },
    });
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }
    res.status(200).json(quote);
  } catch (error) {
    console.error("Error getting quote as whole:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const createShortenedQuote = async (req: Request, res: Response) => {
  try {
    const {loan_type} = req.body;
    if(!loan_type) {
      return res.status(400).json({ error: "Loan type is required" });
    }
    const body = newTermsSheetSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }
    const _quotePayload = {
      address: body.data.property_address,
      loan_type: loan_type,
      is_living_in_property: false,
      is_draft:false,
      property_type: body.data.property_type,
      user_id: body.data.user_id,
      status: QuoteStatus.awaiting,
    }
    const quote = await prisma.quote.create({
      data: _quotePayload,
    });
    const _quoteApplicantInfoPayload = {
      full_name: body.data.full_name,
      phone_number: body.data.phone_number,
      credit_score: Number(body.data.credit_score),
      property_state: body.data.property_state,
      quote_id: quote.id,
    }
    
    const _quoteLoanDetailsPayload = {
      purchase_price: body.data.purchase_price,
      rehab_amount_requested: body.data.rehab_amount_requested,
      after_repair_property_value: body.data.after_repair_property_value,
      requested_loan_amount: body.data.requested_loan_amount,
      quote_id: quote.id,
    }

    const _quoteRentalInfoPayload = {
      monthly_rental_income: body.data.monthly_rental_income,
      annual_property_insurance: body.data.annual_property_insurance,
      annual_property_taxes: body.data.annual_property_taxes,
      monthly_hoa_fee: body.data.monthly_hoa_fee,
      quote_id: quote.id,
    }
    const respose = await Promise.all([
      prisma.quote_Applicant_Info.create({
        data: _quoteApplicantInfoPayload,
      }),
      prisma.quote_Loan_Details.create({
        data: _quoteLoanDetailsPayload,
      }),
      prisma.quote_Rental_Info.create({
        data: _quoteRentalInfoPayload,
      }),
    ]);
    return res.status(201).json(respose);
  } catch (error) {
    console.error("Error creating shortened quote:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}


export const getQuotesForAllEmployees = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const loan_type = req.query["loan-type"] as string;

    // Create where clause with filters
    const where: any = { is_draft: false };
    if (status) {
      where.status = status;
    }
    if (loan_type) {
      where.loan_type = loan_type;
    }

    const result = await PaginationService.paginate(
      prisma.quote,
      req,
      {
        pagination: {
          page: req.query.page as string,
          limit: req.query.limit as string,
        },
        search: {
          search: req.query.search as string,
          searchFields: ['address']
        },
        where,
        orderBy: { created_at: 'desc' },
        include: {
          quoteApplicantInfo: true,
          quoteLoanDetails: true,
          quoteRentalInfo: true,
          quotePriorities: true,
        }
      }
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting quotes for all employees:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}