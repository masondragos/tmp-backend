import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  createEmployeeSchema,
  inviteEmployeeSchema,
} from "../schemas/employee/create-employee";
import { emailService } from "../services/emailService";
import { getAdminURL } from "../utils/url";
import { EmployeeStatus, PrismaClient, Role } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PaginationService } from "../utils/pagination";
import { loginSchema } from "../schemas/auth/login";
import bcrypt from "bcrypt";
import { setAuthCookies } from "../utils/cookies";
// mature.llama.aybd@rapidletter.net
const prisma = new PrismaClient().$extends(withAccelerate());

export const createEmployee = async (req: Request, res: Response) => {
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
    if (decoded.type !== "employee_invitation") {
      return res.status(400).json({ error: "Invalid token type" });
    }

    // Check if employee already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: decoded.id },
    });

    if (existingEmployee?.is_active) {
      return res
        .status(400)
        .json({ error: "Employee with this email already exists" });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(body.data.password, saltRounds);
    const employee = await prisma.employee.update({
      where: { id: Number(decoded.id) },
      data: {
        password: hashedPassword,
        is_active: true,
        invite_status: EmployeeStatus.active,
      },
    });

    res.status(201).json({
      message: "Employee created successfully",
      employee: {
        id: employee.id,
        email: employee.email,
        name: employee.name,
        role: employee.role,
      },
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const inviteEmployee = async (req: Request, res: Response) => {
  try {
    const body = inviteEmployeeSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }

    // Check if employee with this email already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { email: body.data.email },
    });

    if (existingEmployee) {
      // If employee is already active, return error
      if (existingEmployee.is_active && existingEmployee.invite_status === EmployeeStatus.active) {
        return res.status(400).json({ 
          error: "Employee with this email is already active" 
        });
      }

      // If employee exists but is pending, send invitation again
      if (existingEmployee.invite_status === EmployeeStatus.pending) {
        // Generate new JWT invitation token with 7 days expiration
        const invitationToken = generateInvitationToken(existingEmployee.id);
        const invitationLink = `${getAdminURL()}/join?token=${invitationToken}`;

        // Send invitation email
        const emailSent = await emailService.sendEmployeeInvitationEmail(
          body.data.email,
          body.data.name,
          invitationLink
        );

        if (!emailSent) {
          return res.status(500).json({ error: "Failed to send invitation email" });
        }

        return res.status(200).json({
          message: "Invitation resent successfully",
          email: body.data.email,
        });
      }

      // If employee exists but status is expired or cancelled, update and resend
      if (existingEmployee.invite_status === EmployeeStatus.expired || 
          existingEmployee.invite_status === EmployeeStatus.cancelled) {
        
        // Update employee status to pending
        await prisma.employee.update({
          where: { id: existingEmployee.id },
          data: { 
            invite_status: EmployeeStatus.pending,
            name: body.data.name // Update name in case it changed
          },
        });

        // Generate new JWT invitation token with 7 days expiration
        const invitationToken = generateInvitationToken(existingEmployee.id);
        const invitationLink = `${getAdminURL()}/join?token=${invitationToken}`;

        // Send invitation email
        const emailSent = await emailService.sendEmployeeInvitationEmail(
          body.data.email,
          body.data.name,
          invitationLink
        );

        if (!emailSent) {
          return res.status(500).json({ error: "Failed to send invitation email" });
        }

        return res.status(200).json({
          message: "Invitation sent successfully",
          email: body.data.email,
        });
      }
    }

    // If no existing employee, create new one
    const employee = await prisma.employee.create({
      data: {
        email: body.data.email,
        name: body.data.name,
        role: Role.employee,
      },
    });

    // Generate JWT invitation token with 7 days expiration
    const invitationToken = generateInvitationToken(employee.id);
    const invitationLink = `${getAdminURL()}/join?token=${invitationToken}`;

    // Send invitation email
    const emailSent = await emailService.sendEmployeeInvitationEmail(
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
    console.error("Error sending employee invitation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyInvitation = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Token is required" });
    }

    const verification = verifyInvitationToken(token);

    if (!verification.success) {
      return res.status(400).json({ error: verification.error });
    }

    // Check if employee already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { email: verification.decoded.email },
    });

    if (existingEmployee) {
      return res
        .status(400)
        .json({ error: "Employee with this email already exists" });
    }

    res.status(200).json({
      valid: true,
      email: verification.decoded.email,
      name: verification.decoded.name,
    });
  } catch (error) {
    console.error("Error verifying invitation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function to generate JWT invitation token with 7 days expiration
function generateInvitationToken(id: number): string {
  const payload = {
    id,
    type: "employee_invitation",
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
}

// Helper function to verify invitation token
function verifyInvitationToken(token: string): {
  success: boolean;
  decoded?: any;
  error?: string;
} {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    if (typeof decoded === "object" && decoded.type !== "employee_invitation") {
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

export const disableEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
    });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    if (employee.role === Role.admin) {
      return res.status(400).json({ error: "Admin cannot be disabled" });
    }
    await prisma.employee.update({
      where: { id: parseInt(id) },
      data: { is_active: false },
    });
    res.status(200).json({ message: "Employee disabled successfully" });
  } catch (error) {
    console.error("Error disabling employee:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const result = await PaginationService.paginate(prisma.employee, req, {
      pagination: {
        page: req.query.page as string,
        limit: req.query.limit as string,
      },
      search: {
        search: req.query.search as string,
        searchFields: ["name", "email"],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        invite_status: true,
      },
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting employees:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
    });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.status(200).json(employee);
  } catch (error) {
    console.error("Error getting employee:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteEployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Please provide employee id" });
    }
    const employee = await prisma.employee.findUnique({
      where: { id: Number(id) },
    });
    if (!employee) {
      res.status(404).json({ message: "Employee not found" });
    }
    if (employee?.role === Role.admin) {
      res.status(400).json("Admin cannot be deleted");
    }
    await prisma.employee.delete({ where: { id: Number(id) } });
    res.status(200).json({ message: "Employee deleted successfully" });
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
    const user = await prisma.employee.findUnique({
      where: { email: body.data.email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    console.log(user);
    if (!user.is_active) {
      return res.status(401).json({ message: "User is not active yet" });
    }

    // Check if user has a password (not Google-only user)
    if (!user.password) {
      return res.status(401).json({ error: "User is not active yet" });
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
        role: user.role
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
    },'employee_auth_token','employee_info');

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
    const employee = await prisma.employee.findUnique({
      where: { id: Number((req.user as any).id) },
    });
    if (!employee) {
      res.status(404).json({ message: "Employee not found" });
    }else{
      res.status(200).json(employee);
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const makeAdmin = async (req:Request, res:Response)=>{
  await prisma.employee.update({
    where: { id: parseInt('2') },
    data: { is_active: true, role:'admin' },
  });
  res.status(200).json("Admin Created")
}

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Get total lenders count
    const totalLenders = await prisma.lender.count({
      where: { is_active: true }
    });

    // Get total applicants (users) count
    const totalApplicants = await prisma.user.count();

    // Get total quotes count (as term sheets)
    const totalTermSheets = await prisma.quote.count({
      where: { is_draft: false }
    });

    // Loan products - hardcoded as 0 for now
    const loanProducts = 0;

    // Matches made - hardcoded as 0 for now
    const matchesMade = 0;

    const dashboardStats = {
      totalLenders,
      loanProducts,
      totalApplicants,
      matchesMade,
      totalTermSheets
    };

    res.status(200).json(dashboardStats);
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


