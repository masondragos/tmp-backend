import { Router } from 'express';
import {
  createEmployee,
  inviteEmployee,
  verifyInvitation,
  getEmployees,
  getEmployee,
  disableEmployee,
  deleteEployee,
  login,
  getMe,
  makeAdmin,
  getDashboardStats
} from '../controllers/employeeController';
import { verifyJWT } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// Employee invitation routes (public)
router.post('/invite', inviteEmployee);
router.get('/verify-invitation', verifyInvitation);
router.get('/make-admin', makeAdmin);

// Employee registration (public - with valid token)
router.post('/register', createEmployee);
router.post('/login', login)
// Employee management routes (protected - admin only)
router.use(verifyJWT); // Apply JWT middleware to all routes below
router.use('/me', getMe)
router.get('/dashboard/stats', getDashboardStats);
router.use(requireAdmin); // Apply admin role check to all routes below

// Get all employees with pagination and search
router.get('/', getEmployees);

// Get single employee by ID
router.get('/:id', getEmployee);

// Disable employee (soft delete)
router.patch('/:id/disable', disableEmployee);

// Delete employee (hard delete)
router.delete('/:id', deleteEployee);

export default router;
