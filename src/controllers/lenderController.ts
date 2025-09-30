import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { lenderRegistrationSchema, lenderLoginSchema, lenderUpdateSchema } from '../schemas/lender/lender-schema';
import { loanProductSchema, loanProductUpdateSchema } from '../schemas/lender/loan-product-schema';

const prisma = new PrismaClient().$extends(withAccelerate());

export const registerLender = async (req: Request, res: Response) => {
  try {
    const validatedData = lenderRegistrationSchema.parse(req.body);

    const existingLender = await prisma.lender.findUnique({
      where: { email: validatedData.email }
    });

    if (existingLender) {
      return res.status(409).json({ error: 'Lender with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const lender = await prisma.lender.create({
      data: {
        company_name: validatedData.company_name,
        email: validatedData.email,
        password: hashedPassword,
        contact_name: validatedData.contact_name,
        phone_number: validatedData.phone_number,
      },
    });

    const token = jwt.sign(
      { id: lender.id, email: lender.email, type: 'lender' },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '7d' }
    );

    const { password, ...lenderWithoutPassword } = lender;

    res.status(201).json({
      lender: lenderWithoutPassword,
      token,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to register lender' });
  }
};

export const loginLender = async (req: Request, res: Response) => {
  try {
    const validatedData = lenderLoginSchema.parse(req.body);

    const lender = await prisma.lender.findUnique({
      where: { email: validatedData.email }
    });

    if (!lender || !lender.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(validatedData.password, lender.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: lender.id, email: lender.email, type: 'lender' },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '7d' }
    );

    const { password, ...lenderWithoutPassword } = lender;

    res.json({
      lender: lenderWithoutPassword,
      token,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const getLenderProfile = async (req: Request, res: Response) => {
  try {
    const lenderId = parseInt(req.params.id);

    const lender = await prisma.lender.findUnique({
      where: { id: lenderId },
      include: {
        loan_products: true,
      },
    });

    if (!lender) {
      return res.status(404).json({ error: 'Lender not found' });
    }

    const { password, ...lenderWithoutPassword } = lender;

    res.json(lenderWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lender profile' });
  }
};

export const updateLender = async (req: Request, res: Response) => {
  try {
    const lenderId = parseInt(req.params.id);
    const validatedData = lenderUpdateSchema.parse(req.body);

    const lender = await prisma.lender.update({
      where: { id: lenderId },
      data: validatedData,
    });

    const { password, ...lenderWithoutPassword } = lender;

    res.json(lenderWithoutPassword);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Lender not found' });
    }
    res.status(500).json({ error: 'Failed to update lender' });
  }
};

export const getAllLenders = async (req: Request, res: Response) => {
  try {
    const lenders = await prisma.lender.findMany({
      select: {
        id: true,
        company_name: true,
        email: true,
        contact_name: true,
        phone_number: true,
        created_at: true,
        updated_at: true,
        loan_products: {
          select: {
            id: true,
            loan_type: true,
            min_loan_amount: true,
            max_loan_amount: true,
            states_funded: true,
          },
        },
      },
    });

    res.json(lenders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lenders' });
  }
};

export const createLoanProduct = async (req: Request, res: Response) => {
  try {
    const lenderId = parseInt(req.params.lenderId);
    const validatedData = loanProductSchema.parse(req.body);

    const loanProduct = await prisma.lender_Loan_Product.create({
      data: {
        lender_id: lenderId,
        ...validatedData,
      },
    });

    res.status(201).json(loanProduct);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create loan product' });
  }
};

export const updateLoanProduct = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const validatedData = loanProductUpdateSchema.parse(req.body);

    const loanProduct = await prisma.lender_Loan_Product.update({
      where: { id: productId },
      data: validatedData,
    });

    res.json(loanProduct);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Loan product not found' });
    }
    res.status(500).json({ error: 'Failed to update loan product' });
  }
};

export const deleteLoanProduct = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);

    await prisma.lender_Loan_Product.delete({
      where: { id: productId },
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Loan product not found' });
    }
    res.status(500).json({ error: 'Failed to delete loan product' });
  }
};

export const getLenderLoanProducts = async (req: Request, res: Response) => {
  try {
    const lenderId = parseInt(req.params.lenderId);

    const loanProducts = await prisma.lender_Loan_Product.findMany({
      where: { lender_id: lenderId },
    });

    res.json(loanProducts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loan products' });
  }
};
