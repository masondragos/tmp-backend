import { Request, Response } from 'express'
import passport from '../auth'
import jwt from 'jsonwebtoken'
import { getUrls } from '../utils/url'
import { setAuthCookies, clearAuthCookies } from '../utils/cookies'

export const googleAuth = (req: Request, res: Response, next: any) => {
  // Pass the 'from' parameter through OAuth state
  console.log('Google Auth - query.from:', req.query.from)
  
  const state = req.query.from ? encodeURIComponent(req.query.from as string) : undefined
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: state // This will be available in req.query.state in the callback
  })(req, res, next)
}

export const googleCallback = [
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req: Request, res: Response) => {
    try {
      const user = req.user as any
      
      // Access from parameter from OAuth state
      const from = req.query.state ? decodeURIComponent(req.query.state as string) : undefined
      console.log('Callback - from state param:', from)
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          name: user.name 
        },
        process.env.JWT_SECRET || 'your-jwt-secret',
        { 
          expiresIn: '7d' // Token expires in 7 days
        }
      )
      
      // Set authentication cookies using utility function
      setAuthCookies(res, token, {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      })
      
      const { frontendURL } = getUrls();
      if(from === 'modal') {
        res.redirect(`${frontendURL}?login_success=true`)
      } else {
        res.redirect(`${frontendURL}/get-quotes?step=sign-in&login_success=true`)
      }
    } catch (error) {
      console.error('Error in Google callback:', error)
      const from = req.query.state ? decodeURIComponent(req.query.state as string) : undefined
      const { frontendURL } = getUrls();
      if(from === 'modal') {
        res.redirect(`${frontendURL}?login_success=false`)
      } else {
        res.redirect(`${frontendURL}/get-quotes?step=sign-in&login_success=false`)
      }
    }
  }
]

export const logout = (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' })
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session destruction failed' })
      }
      
      // Clear all authentication cookies
      res.clearCookie('connect.sid')
      clearAuthCookies(res)
      
      res.json({ message: 'Logged out successfully' })
    })
  })
}

export const getMe = (req: Request, res: Response) => {
  const user = req.user as any
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || null
  })
}

// Get user info from cookies (for frontend)
export const getUserFromCookie = (req: Request, res: Response) => {
  try {
    const userInfo = req.cookies.userInfo
    
    if (!userInfo) {
      return res.status(401).json({ error: 'No user information found' })
    }
    
    const user = JSON.parse(userInfo)
    res.json({ 
      success: true, 
      user: user 
    })
  } catch (error) {
    res.status(401).json({ error: 'Invalid user information' })
  }
}
