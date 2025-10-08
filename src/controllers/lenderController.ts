import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  createEmployeeSchema,
  inviteEmployeeSchema,
} from "../schemas/employee/create-employee";
import { emailService } from "../services/emailService";
import { getAdminURL, getLenderURL } from "../utils/url";
import { EmployeeStatus, PrismaClient, Role } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PaginationService } from "../utils/pagination";
import { loginSchema } from "../schemas/auth/login";
import bcrypt from "bcrypt";
import { setAuthCookies } from "../utils/cookies";

const prisma = new PrismaClient().$extends(withAccelerate());

export const createLender = async (req: Request, res: Response) => {
  try {
    const body = createEmployeeSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(body.data.token, process.env.JWT_SECRET!);
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(400).json({ error: "Invitation token has expired" });
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        return res.status(400).json({ error: "Invalid invitation token" });
      } else {
        return res.status(400).json({ error: "Token verification failed" });
      }
    }

    // Check token type
    if (decoded.type !== "lender_invitation") {
      return res.status(400).json({ error: "Invalid token type" });
    }

    // Check if employee already exists
    const existing = await prisma.lender.findUnique({
      where: { id: decoded.id },
    });

    if (existing?.is_active) {
      return res
        .status(400)
        .json({ error: "Lender with this email already exists" });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(body.data.password, saltRounds);
    const lender = await prisma.lender.update({
      where: { id: Number(decoded.id) },
      data: {
        password: hashedPassword,
        is_active: true,
        invite_status: EmployeeStatus.active,
      },
    });

    res.status(201).json({
      message: "Lender created successfully",
      lender: {
        id: lender.id,
        email: lender.email,
        name: lender.name,
      },
    });
  } catch (error) {
    console.error("Error creating Lender:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const inviteLender = async (req: Request, res: Response) => {
  try {
    const body = inviteEmployeeSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }
    const lender = await prisma.lender.create({
      data: {
        email: body.data.email,
        name: body.data.name,
      },
    });

    // Generate JWT invitation token with 7 days expiration
    const invitationToken = generateInvitationToken(lender.id);
    const invitationLink = `${getLenderURL()}/join?token=${invitationToken}&invite_for=lender`;

    // Send invitation email
    const emailSent = await emailService.sendLenderInvitationEmail(
      body.data.email,
      body.data.name,
      invitationLink
    );

    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send invitation email" });
    }

    res.status(200).json({
      message: "Invitation sent successfully",
      email: body.data.email,
    });
  } catch (error) {
    console.error("Error sending Lender invitation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

function generateInvitationToken(id: number): string {
  const payload = {
    id,
    type: "lender_invitation",
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
}

function verifyInvitationToken(token: string): {
  success: boolean;
  decoded?: any;
  error?: string;
} {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    if (typeof decoded === "object" && decoded.type !== "lender_invitation") {
      return { success: false, error: "Invalid token type" };
    }

    return { success: true, decoded };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: "Invitation token has expired" };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, error: "Invalid invitation token" };
    } else {
      return { success: false, error: "Token verification failed" };
    }
  }
}

export const disableLender = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lender = await prisma.lender.findUnique({
      where: { id: parseInt(id) },
    });
    if (!lender) {
      return res.status(404).json({ error: "Lender not found" });
    }
    await prisma.lender.update({
      where: { id: parseInt(id) },
      data: { is_active: false },
    });
    res.status(200).json({ message: "Lender disabled successfully" });
  } catch (error) {
    console.error("Error disabling Lender:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLenders = async (req: Request, res: Response) => {
  try {
    const result = await PaginationService.paginate(prisma.lender, req, {
      pagination: {
        page: req.query.page as string,
        limit: req.query.limit as string,
      },
      search: {
        search: req.query.search as string,
        searchFields: ["name"],
      },
      select: {
        id: true,
        name: true,
        email: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        invite_status: true,
      },
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting Lenders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLender = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lender = await prisma.lender.findUnique({
      where: { id: parseInt(id) },
    });
    if (!lender) {
      return res.status(404).json({ error: "Lender not found" });
    }
    res.status(200).json(lender);
  } catch (error) {
    
    console.error("Error getting Lender:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteLender = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Please provide Lender id" });
    }
    const lender = await prisma.lender.findUnique({
      where: { id: Number(id) },
    });
    if (!lender) {
      res.status(404).json({ message: "Lender not found" });
    }
    await prisma.lender.delete({ where: { id: Number(id) } });
    res.status(200).json({ message: "Lender deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error || "Internal server error" });
  }
};

export const login = async (request: Request, res: Response) => {
  try {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }
    // Find user by email
    const user = await prisma.lender.findUnique({
      where: { email: body.data.email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!user.is_active) {
      return res.status(401).json({ message: "Lender is not active yet" });
    }

    // Check if user has a password (not Google-only user)
    if (!user.password) {
      return res.status(401).json({ error: "Lender is not active yet" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      body.data.password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET || "your-jwt-secret",
      {
        expiresIn: "7d", // Token expires in 7 days
      }
    );

    // Set authentication cookies using utility function
    setAuthCookies(res, token, {
      id: user.id.toString(),
      email: user.email,
      name: user.name || "",
      avatar: null,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const id = (req.user as any).id;
    if (!id) {
      return res.status(400).json({ message: "Please provide user id" });
    }
    const lender = await prisma.lender.findUnique({
      where: { id: Number(id) },
    });
    if(!lender){
        res.status(404).json({message:"Lender not found"})
    }
    res.status(200).json(lender)
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const getLenderStats = async (req: Request, res: Response) => {
  try {
    const lenderId = (req.user as any)?.id;
    const id = parseInt(lenderId);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid lender ID" });
    }

    const [activeApplications, approvedDeals, pendingReviews] = await Promise.all([
      prisma.loan_Connection.count({
        where: {
          lender_id: id,
          term_sheet_status: { in: ["awaiting", "available"] as any },
        },
      }),
      prisma.loan_Connection.count({
        where: { lender_id: id, term_sheet_status: "signed" as any },
      }),
      prisma.loan_Connection.count({
        where: { lender_id: id, term_sheet_status: "pending" as any },
      }),
    ]);

    return res.status(200).json({
      active_applications: activeApplications,
      approved_deals: approvedDeals,
      pending_reviews: pendingReviews,
      total_funded: 0,
    });
  } catch (error) {
    console.error("Error fetching lender stats:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}