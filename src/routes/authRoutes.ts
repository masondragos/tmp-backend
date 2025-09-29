import { Router } from 'express'
import { googleAuth, googleCallback, logout, getMe, getUserFromCookie } from '../controllers/authController'
import { isAuthenticated } from '../middleware/auth'

const router = Router()

// Authentication Routes
router.get('/google', googleAuth)

router.get('/google/callback', ...googleCallback)

router.get('/logout', logout)

router.get('/me', isAuthenticated, getMe)

// Get user info from cookies (no authentication required)
router.get('/user-info', getUserFromCookie)

export default router
