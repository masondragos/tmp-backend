import { Request, Response } from "express";
import { PrismaClient, TermSheetStatus } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PaginationService } from "../utils/pagination";
import { z } from "zod";

const prisma = new PrismaClient().$extends(withAccelerate());

// Validation schemas
const createLoanConnectionSchema = z.object({
  lender_id: z.number().int().positive(),
  employee_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  quote_id: z.number().int().positive(),
  loan_product_id: z.number().int().positive().optional(),
});

const updateLoanConnectionSchema = z.object({
  lender_id: z.number().int().positive().optional(),
  employee_id: z.number().int().positive().optional(),
  user_id: z.number().int().positive().optional(),
  quote_id: z.number().int().positive().optional(),
  loan_product_id: z.number().int().positive().optional(),
});

/**
 * Create a new loan connection
 */
export const createLoanConnection = async (req: Request, res: Response) => {
  try {
    const body = createLoanConnectionSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }

    // Check if lender-quote combination already exists
    const existingLenderQuote = await prisma.loan_Connection.findFirst({
      where: {
        loan_product_id: body.data.loan_product_id,
        quote_id: body.data.quote_id,
        term_sheet_status: {
          in: [
            TermSheetStatus.awaiting,
            TermSheetStatus.pending,
            TermSheetStatus.signed,
            TermSheetStatus.available,
          ],
        },
      },
    });

    if (existingLenderQuote) {
      return res.status(400).json({
        error: "This lender is already connected to this quote",
      });
    }

    // Verify all referenced entities exist
    const [lender, employee, user, quote] = await Promise.all([
      prisma.lender.findUnique({ where: { id: body.data.lender_id } }),
      prisma.employee.findUnique({ where: { id: body.data.employee_id } }),
      prisma.user.findUnique({ where: { id: body.data.user_id } }),
      prisma.quote.findUnique({ where: { id: body.data.quote_id } }),
    ]);

    if (!lender) {
      return res.status(404).json({ error: "Lender not found" });
    }
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const loanConnection = await prisma.loan_Connection.create({
      data: body.data,
      include: {
        lender: {
          select: {
            id: true,
            name: true,
            email: true,
            is_active: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            is_active: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quote: {
          include: {
            quoteApplicantInfo: true,
            quoteLoanDetails: true,
            quoteRentalInfo: true,
            quotePriorities: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(loanConnection);
  } catch (error) {
    console.error("Error creating loan connection:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get all loan connections with pagination
 */
export const getLoanConnections = async (req: Request, res: Response) => {
  try {
    const result = await PaginationService.paginate(
      prisma.loan_Connection,
      req,
      {
        pagination: {
          page: req.query.page as string,
          limit: req.query.limit as string,
        },
        search: {
          search: req.query.search as string,
          searchFields: [
            "lender.name",
            "employee.name",
            "user.name",
            "quote.address",
          ],
        },
        include: {
          lender: {
            select: {
              id: true,
              name: true,
              email: true,
              is_active: true,
            },
          },
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              is_active: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          quote: {
            include: {
              quoteApplicantInfo: true,
              quoteLoanDetails: true,
              quoteRentalInfo: true,
              quotePriorities: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
      }
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting loan connections:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get a specific loan connection by ID
 */
export const getLoanConnection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const connectionId = parseInt(id);

    if (isNaN(connectionId)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }

    const loanConnection = await prisma.loan_Connection.findUnique({
      where: { id: connectionId },
      include: {
        lender: {
          select: {
            id: true,
            name: true,
            email: true,
            is_active: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            is_active: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quote: {
          include: {
            quoteApplicantInfo: true,
            quoteLoanDetails: true,
            quoteRentalInfo: true,
            quotePriorities: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!loanConnection) {
      return res.status(404).json({ error: "Loan connection not found" });
    }

    res.status(200).json(loanConnection);
  } catch (error) {
    console.error("Error getting loan connection:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Update a loan connection
 */
export const updateLoanConnection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const connectionId = parseInt(id);

    if (isNaN(connectionId)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }

    const body = updateLoanConnectionSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }

    // Check if connection exists
    const existingConnection = await prisma.loan_Connection.findUnique({
      where: { id: connectionId },
    });

    if (!existingConnection) {
      return res.status(404).json({ error: "Loan connection not found" });
    }

    // If updating quote_id, check for uniqueness
    if (
      body.data.quote_id &&
      body.data.quote_id !== existingConnection.quote_id
    ) {
      const quoteConnection = await prisma.loan_Connection.findFirst({
        where: { quote_id: body.data.quote_id },
      });

      if (quoteConnection) {
        return res.status(400).json({
          error: "This quote already has a lender connection",
        });
      }
    }

    // If updating lender_id and quote_id, check for duplicate combination
    if (body.data.lender_id && body.data.quote_id) {
      const lenderQuoteConnection = await prisma.loan_Connection.findFirst({
        where: {
          lender_id: body.data.lender_id,
          quote_id: body.data.quote_id,
          id: { not: connectionId },
        },
      });

      if (lenderQuoteConnection) {
        return res.status(400).json({
          error: "This lender is already connected to this quote",
        });
      }
    }

    // Verify referenced entities exist if provided
    if (body.data.lender_id) {
      const lender = await prisma.lender.findUnique({
        where: { id: body.data.lender_id },
      });
      if (!lender) {
        return res.status(404).json({ error: "Lender not found" });
      }
    }

    if (body.data.employee_id) {
      const employee = await prisma.employee.findUnique({
        where: { id: body.data.employee_id },
      });
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
    }

    if (body.data.user_id) {
      const user = await prisma.user.findUnique({
        where: { id: body.data.user_id },
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
    }

    if (body.data.quote_id) {
      const quote = await prisma.quote.findUnique({
        where: { id: body.data.quote_id },
      });
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }
    }

    const updatedConnection = await prisma.loan_Connection.update({
      where: { id: connectionId },
      data: body.data,
      include: {
        lender: {
          select: {
            id: true,
            name: true,
            email: true,
            is_active: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            is_active: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quote: {
          include: {
            quoteApplicantInfo: true,
            quoteLoanDetails: true,
            quoteRentalInfo: true,
            quotePriorities: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(updatedConnection);
  } catch (error) {
    console.error("Error updating loan connection:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete a loan connection
 */
export const deleteLoanConnection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const connectionId = parseInt(id);

    if (isNaN(connectionId)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }

    const existingConnection = await prisma.loan_Connection.findUnique({
      where: { id: connectionId },
    });

    if (!existingConnection) {
      return res.status(404).json({ error: "Loan connection not found" });
    }

    await prisma.loan_Connection.delete({
      where: { id: connectionId },
    });

    res.status(200).json({ message: "Loan connection deleted successfully" });
  } catch (error) {
    console.error("Error deleting loan connection:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get loan connections by lender ID
 */
export const getLoanConnectionsByLender = async (
  req: Request,
  res: Response
) => {
  try {
    const lenderId = (req.user as any).id;
    const id = parseInt(lenderId);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid lender ID" });
    }

    // Check if lender exists
    const lender = await prisma.lender.findUnique({ where: { id } });
    if (!lender) {
      return res.status(404).json({ error: "Lender not found" });
    }

    const result = await PaginationService.paginate(
      prisma.loan_Connection,
      req,
      {
        pagination: {
          page: req.query.page as string,
          limit: req.query.limit as string,
        },
        search: {
          search: req.query.search as string,
          searchFields: ["employee.name", "user.name", "quote.address"],
        },
        where: { lender_id: id, term_sheet_status: TermSheetStatus.awaiting },
        include: {
          lender: {
            select: {
              id: true,
              name: true,
              email: true,
              is_active: true,
            },
          },
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              is_active: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          quote: {
            include: {
              quoteApplicantInfo: true,
              quoteLoanDetails: true,
              quoteRentalInfo: true,
              quotePriorities: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
      }
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting loan connections by lender:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get loan connections by quote ID
 */
export const getLoanConnectionByQuote = async (req: Request, res: Response) => {
  try {
    const { quoteId } = req.params;
    const id = parseInt(quoteId);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid quote ID" });
    }

    // Check if quote exists
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const loanConnection = await prisma.loan_Connection.findFirst({
      where: { quote_id: id },
      include: {
        lender: {
          select: {
            id: true,
            name: true,
            email: true,
            is_active: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            is_active: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quote: {
          include: {
            quoteApplicantInfo: true,
            quoteLoanDetails: true,
            quoteRentalInfo: true,
            quotePriorities: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!loanConnection) {
      return res
        .status(404)
        .json({ error: "No loan connection found for this quote" });
    }

    res.status(200).json(loanConnection);
  } catch (error) {
    console.error("Error getting loan connection by quote:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get loan connections by user ID
 */
export const getLoanConnectionsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const id = parseInt(userId);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const result = await PaginationService.paginate(
      prisma.loan_Connection,
      req,
      {
        pagination: {
          page: req.query.page as string,
          limit: req.query.limit as string,
        },
        search: {
          search: req.query.search as string,
          searchFields: ["lender.name", "employee.name", "quote.address"],
        },
        where: { user_id: id },
        include: {
          lender: {
            select: {
              id: true,
              name: true,
              email: true,
              is_active: true,
            },
          },
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              is_active: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          quote: {
            include: {
              quoteApplicantInfo: true,
              quoteLoanDetails: true,
              quoteRentalInfo: true,
              quotePriorities: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
      }
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting loan connections by user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get loan connections by employee ID
 */
export const getLoanConnectionsByEmployee = async (
  req: Request,
  res: Response
) => {
  try {
    const { employeeId } = req.params;
    const id = parseInt(employeeId);

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const result = await PaginationService.paginate(
      prisma.loan_Connection,
      req,
      {
        pagination: {
          page: req.query.page as string,
          limit: req.query.limit as string,
        },
        search: {
          search: req.query.search as string,
          searchFields: ["lender.name", "user.name", "quote.address"],
        },
        where: { employee_id: id },
        include: {
          lender: {
            select: {
              id: true,
              name: true,
              email: true,
              is_active: true,
            },
          },
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              is_active: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          quote: {
            include: {
              quoteApplicantInfo: true,
              quoteLoanDetails: true,
              quoteRentalInfo: true,
              quotePriorities: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
      }
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting loan connections by employee:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLoanConnectionsForEmployee = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await PaginationService.paginate(
      prisma.loan_Connection,
      req,
      {
        pagination: {
          page: req.query.page as string,
          limit: req.query.limit as string,
        },
        where: { term_sheet_status: req.query.status as TermSheetStatus },
        include: {
          lender: {
            select: {
              id: true,
              name: true,
              email: true,
              is_active: true,
            },
          },
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              is_active: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          loan_product: true,
          quote: {
            include: {
              quoteApplicantInfo: true,
              quoteLoanDetails: true,
              quoteRentalInfo: true,
              quotePriorities: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
      }
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting loan connections by employee:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
