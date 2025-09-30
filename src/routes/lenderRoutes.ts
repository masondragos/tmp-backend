import express from 'express';
import {
  registerLender,
  loginLender,
  getLenderProfile,
  updateLender,
  getAllLenders,
  createLoanProduct,
  updateLoanProduct,
  deleteLoanProduct,
  getLenderLoanProducts,
} from '../controllers/lenderController';

const router = express.Router();

// Lender authentication
router.post('/register', registerLender);
router.post('/login', loginLender);

// Lender management
router.get('/', getAllLenders);
router.get('/:id', getLenderProfile);
router.put('/:id', updateLender);

// Loan product management
router.get('/:lenderId/loan-products', getLenderLoanProducts);
router.post('/:lenderId/loan-products', createLoanProduct);
router.put('/loan-products/:productId', updateLoanProduct);
router.delete('/loan-products/:productId', deleteLoanProduct);

export default router;
