import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
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

const prisma = new PrismaClient().$extends(withAccelerate());
// Step till signin/signup
export const createQuote = async (req: Request, res: Response) => {
  console.log("Calling create quote")
  try {
    const body = quoteSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }
    
    const quote = await prisma.quote.create({
      data: { ...body.data },
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
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const quotes = await prisma.quote.findMany({
      where: { user_id: parseInt(userId) },
      orderBy: { created_at: 'desc' }, // Most recent first
      include: {
        quoteApplicantInfo: true,
        quoteLoanDetails: true,
        quoteRentalInfo: true,
        quotePriorities: true,
      },
    });

    res.status(200).json(quotes);
  } catch (error) {
    console.error("Error getting all quotes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

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

// Lender matching endpoints
import { matchQuoteToLenders, saveMatchResults, getMatchesForQuote } from '../services/lenderMatchingService';

export const matchQuoteWithLenders = async (req: Request, res: Response) => {
  try {
    const quoteId = parseInt(req.params.id);

    if (isNaN(quoteId) || quoteId <= 0) {
      return res.status(400).json({ error: 'Invalid quote ID' });
    }

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    const matchResults = await matchQuoteToLenders(quoteId);
    await saveMatchResults(quoteId, matchResults);

    const qualifiedLenders = matchResults.filter(r => r.match_status === 'qualified');
    const disqualifiedLenders = matchResults.filter(r => r.match_status === 'disqualified');

    res.json({
      quote_id: quoteId,
      total_lenders: matchResults.length,
      qualified_count: qualifiedLenders.length,
      disqualified_count: disqualifiedLenders.length,
      qualified_lenders: qualifiedLenders,
      disqualified_lenders: disqualifiedLenders,
    });
  } catch (error) {
    console.error('Error matching quote with lenders:', error);
    res.status(500).json({ error: 'Failed to match quote with lenders' });
  }
};

export const getQuoteLenderMatches = async (req: Request, res: Response) => {
  try {
    const quoteId = parseInt(req.params.id);

    if (isNaN(quoteId) || quoteId <= 0) {
      return res.status(400).json({ error: 'Invalid quote ID' });
    }

    const matches = await getMatchesForQuote(quoteId);

    const qualified = matches.filter(m => m.match_status === 'qualified');
    const disqualified = matches.filter(m => m.match_status === 'disqualified');

    res.json({
      quote_id: quoteId,
      total_matches: matches.length,
      qualified_count: qualified.length,
      disqualified_count: disqualified.length,
      qualified_lenders: qualified,
      disqualified_lenders: disqualified,
    });
  } catch (error) {
    console.error('Error getting quote lender matches:', error);
    res.status(500).json({ error: 'Failed to get lender matches' });
  }
};
