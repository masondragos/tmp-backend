import { Router } from "express";
import {
  createLoanProduct,
  getLoanProducts,
  getLoanProduct,
  updateLoanProduct,
  deleteLoanProduct,
  getLoanProductsByLender,
  getBestLoanProducts,
} from "../controllers/loanProductController";
import { verifyJWT } from "../middleware/auth";
import { requireEmployee } from "../middleware/adminAuth";

const router = Router();

// Loan Product Routes (includes criteria management)
router.use(verifyJWT);
router.post("/", createLoanProduct);
router.get("/", getLoanProducts);
router.get("/:id", getLoanProduct);
router.put("/:id", updateLoanProduct);
router.delete("/:id", deleteLoanProduct);

router.use(requireEmployee);
router.get("/lender/:lenderId", getLoanProductsByLender);
router.get('/best/:quoteId', getBestLoanProducts);

export default router;
