import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import bcrypt from 'bcrypt'
import { setAuthCookies } from '../utils/cookies'

const prisma = new PrismaClient().$extends(withAccelerate())

export const createUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' })
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' })
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const result = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Generate JWT token for new user
    const jwt = require('jsonwebtoken')
    const token = jwt.sign(
      { 
        id: result.id, 
        email: result.email, 
        name: result.name 
      },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { 
        expiresIn: '7d' // Token expires in 7 days
      }
    )

    // Set authentication cookies using utility function
    setAuthCookies(res, token, {
      id: result.id.toString(),
      email: result.email,
      name: result.name || '',
      avatar: result.avatar
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = result

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
}

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check if user has a password (not Google-only user)
    if (!user.password) {
      return res.status(401).json({ error: 'Please use Google sign-in for this account' })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken')
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
      id: user.id.toString(),
      email: user.email,
      name: user.name || '',
      avatar: user.avatar
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Error during login:', error)
    res.status(500).json({ error: 'Login failed' })
  }
}

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        created_at: true,
        updated_at: true
      }
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
}

