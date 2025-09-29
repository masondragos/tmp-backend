import { Router } from 'express'
import { createUser, loginUser, getAllUsers } from '../controllers/userController'
import { isAuthenticated } from '../middleware/auth'

const router = Router()

// User Routes
router.post('/signup', createUser)
router.post('/login', loginUser)

router.get('/users', getAllUsers)

// Protected user routes
router.get('/protected/users', isAuthenticated, getAllUsers)

export default router
