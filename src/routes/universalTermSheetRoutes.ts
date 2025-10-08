import { Router } from "express";
import { verifyJWT } from "../middleware/auth";
import {
  createUniversalTermSheets,
  getUniversalTermSheets,
  getUniversalTermSheetsByQuote,
  getUniversalTermSheetsByLender,
  getUniversalTermSheetsByLoanConnection,
  updateUniversalTermSheet,
  deleteUniversalTermSheet,
} from "../controllers/universalTermSheetController";

const router = Router();

router.use(verifyJWT);

router.post("/", createUniversalTermSheets); // Accepts { items: [...] } or [...] array
router.get("/", getUniversalTermSheets);
router.get("/quote/:quoteId", getUniversalTermSheetsByQuote);
router.get("/lender/:lenderId", getUniversalTermSheetsByLender);
router.get("/connection/:connectionId", getUniversalTermSheetsByLoanConnection);
router.put("/:id", updateUniversalTermSheet);
router.delete("/:id", deleteUniversalTermSheet);

export default router;


