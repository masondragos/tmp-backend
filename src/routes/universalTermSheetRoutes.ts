import { Router } from "express";
import { verifyJWT } from "../middleware/auth";
import {
  createUniversalTermSheets,
  getUniversalTermSheets,
  getUniversalTermSheetsByQuote,
  getUniversalTermSheetsByLender,
  getUniversalTermSheetsByLoanConnection,
  // updateUniversalTermSheet,
  deleteUniversalTermSheet,
  updateTermSheetStatus,
} from "../controllers/universalTermSheetController";
import { requireEmployee } from "../middleware/adminAuth";

const router = Router();

router.use(verifyJWT);

router.post("/", createUniversalTermSheets); // Accepts { items: [...] } or [...] array
router.get("/", getUniversalTermSheets);
router.get("/quote/:quoteId/connection/:connectionId", getUniversalTermSheetsByQuote);
router.get("/lender/:lenderId", getUniversalTermSheetsByLender);
router.get("/connection/:connectionId", getUniversalTermSheetsByLoanConnection);
// router.put("/:id", updateUniversalTermSheet);
router.delete("/:id", deleteUniversalTermSheet);
router.use(requireEmployee)
router.put("/:id/status", updateTermSheetStatus);

export default router;


