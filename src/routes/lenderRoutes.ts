import { Router } from 'express';
import { verifyJWT } from '../middleware/auth';
import { requireAdmin, requireEmployee } from '../middleware/adminAuth';
import { createLender, deleteLender, disableLender, getLender, getLenders, getMe, getLenderStats, inviteLender, login } from '../controllers/lenderController';

const router = Router();

// Employee invitation routes (public)
router.post('/invite', inviteLender);

// Employee registration (public - with valid token)
router.post('/register', createLender);
router.post('/login', login)
// Employee management routes (protected - admin only)
router.use(verifyJWT); // Apply JWT middleware to all routes below

router.get('/me', getMe)
router.get('/stats', getLenderStats);
router.use(requireEmployee); // Apply admin role check to all routes below

// Get all employees with pagination and search
router.get('/', getLenders);

// Get single employee by ID
router.get('/:id', getLender);

// Disable employee (soft delete)
router.patch('/:id/disable', disableLender);

// Delete employee (hard delete)
router.delete('/:id', deleteLender);

export default router;
