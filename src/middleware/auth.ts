import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Authentication middleware
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // Check session-based authentication first
  if (req.isAuthenticated()) {
    return next()
  }
  
  // Check JWT token from cookie
  const token = req.cookies.authToken
  if (!token) {
    return res.status(401).json({ error: 'No authentication token found' })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret') as any
    
    // Add user info to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      ...(decoded.role && { role: decoded.role })
    }
    
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid authentication token' })
  }
}

// Middleware to verify JWT token only (for API routes)
export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.authToken
  
  if (!token) {
    return res.status(401).json({ error: 'No authentication token found' })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret') as any
    
    // Add user info to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      ...(decoded.role && { role: decoded.role })
    }
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid authentication token' })
  }
}
