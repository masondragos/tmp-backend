import { Router } from 'express';
import {
  createLoanConnection,
  getLoanConnections,
  getLoanConnection,
  updateLoanConnection,
  deleteLoanConnection,
  getLoanConnectionsByLender,
  getLoanConnectionByQuote,
  getLoanConnectionsByUser,
  getLoanConnectionsByEmployee,
  getLoanConnectionsForEmployee,
} from '../controllers/loanConnectionController';
import { verifyJWT } from '../middleware/auth';
import { requireEmployee } from '../middleware/adminAuth';

const router = Router();

// Apply JWT middleware to all routes
router.use(verifyJWT);

// Apply employee role check to all routes (employees and admins can access)
// Get all loan connections with pagination and search

// Get a specific loan connection by ID

// Update a loan connection
router.put('/:id', updateLoanConnection);

// Delete a loan connection
router.delete('/:id', deleteLoanConnection);

// Specialized query routes
router.get('/', getLoanConnections);
// Get loan connections by lender ID
router.get('/lender', getLoanConnectionsByLender);

// Get loan connection by quote ID (1-1 relationship)
router.get('/quote/:quoteId', getLoanConnectionByQuote);

// Get loan connections by user ID
router.get('/user/:userId', getLoanConnectionsByUser);

router.get('/employee', getLoanConnectionsForEmployee);
router.get('/:id', getLoanConnection);
// Employee routes - must be before /:id route
router.use(requireEmployee);
router.get('/employee/:employeeId', getLoanConnectionsByEmployee);

// Create a new loan connection
router.post('/', createLoanConnection);

// Get a specific loan connection by ID - must be LAST


export default router;
