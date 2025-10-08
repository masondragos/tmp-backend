import { Router } from "express";
import {
  createQuote,
  getQuote,
  getAllQuotes,
  updateQuote,
  createQuoteApplicantInfo,
  getQuoteApplicantInfo,
  updateQuoteApplicantInfo,
  createQuoteLoanDetails,
  updateQuoteLoanDetails,
  getQuoteLoanDetails,
  createQuotePriorities,
  getQuotePriorities,
  updateQuotePriorities,
  createQuoteRentalInfo,
  getQuoteRentalInfo,
  updateQuoteRentalInfo,
  getQuoteAsWhole,
  createShortenedQuote,
  getQuotesCountByStatus,
  getQuotesForAllEmployees,
} from "../controllers/quoteController";
import { verifyJWT } from "../middleware/auth";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Quote routes
router.post("/", createQuote);
router.get("/count-by-status", getQuotesCountByStatus);
router.get("/admin", getQuotesForAllEmployees);
router.get("/", getAllQuotes); // Get all quotes for authenticated user
router.get("/:id", getQuote);
router.put("/:id", updateQuote);
router.get("/:id/whole", getQuoteAsWhole);
router.post("/shortened", createShortenedQuote);

// Quote Applicant Info routes
router.post("/applicant-info", createQuoteApplicantInfo);
router.get("/:id/applicant-info", getQuoteApplicantInfo);
router.put("/:id/applicant-info", updateQuoteApplicantInfo);

// Quote Loan Details routes
router.post("/loan-details", createQuoteLoanDetails);
router.get("/:id/loan-details", getQuoteLoanDetails);
router.put("/:id/loan-details", updateQuoteLoanDetails);

// Quote Priorities routes
router.post("/priorities", createQuotePriorities);
router.get("/:id/priorities", getQuotePriorities);
router.put("/:id/priorities", updateQuotePriorities);

// Quote Rental Info routes
router.post("/rental-info", createQuoteRentalInfo);
router.get("/:id/rental-info", getQuoteRentalInfo);
router.put("/:id/rental-info", updateQuoteRentalInfo);

export default router;
