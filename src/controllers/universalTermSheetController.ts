import { Request, Response } from "express";
import {
  PrismaClient,
  TermSheetStatus,
  UniversalTermSheetStatus,
} from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { z } from "zod";
import { PaginationService } from "../utils/pagination";

const prisma = new PrismaClient().$extends(withAccelerate());

const baseTermSheetSchema = z.object({
  // IDs are optional in items, can be provided at top-level
  quote_id: z.number().int().positive().optional(),
  lender_id: z.number().int().positive().optional(),
  loan_product_id: z.number().int().positive().optional(),
  loan_connection_id: z.number().int().positive().optional(),

  term_sheet_data: z.string().optional(),
});

// Schema requiring common IDs at top-level
const bulkCreateSchema = z.object({
  quote_id: z.number().int().positive(),
  lender_id: z.number().int().positive(),
  loan_product_id: z.number().int().positive().optional(),
  loan_connection_id: z.number().int().positive().optional(),
  items: z
    .array(
      baseTermSheetSchema.omit({
        quote_id: true,
        lender_id: true,
        loan_product_id: true,
        loan_connection_id: true,
      })
    )
    .min(1),
});

const updateSchema = baseTermSheetSchema.partial();

export const createUniversalTermSheets = async (
  req: Request,
  res: Response
) => {
  try {
    // Validate request body
    const validated = bulkCreateSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error.message });
    }

    const { quote_id, lender_id, loan_product_id, loan_connection_id, items } =
      validated.data;

    // Merge common IDs into each item
    const itemsWithIds = items.map((item) => ({
      ...item,
      quote_id,
      lender_id,
      loan_product_id: loan_product_id ?? undefined,
      loan_connection_id: loan_connection_id ?? undefined,
    }));

    // Validate referenced entities exist
    const [quote, lender, loanProduct, loanConnection] = await Promise.all([
      prisma.quote.findUnique({
        where: { id: quote_id },
        select: { id: true },
      }),
      prisma.lender.findUnique({
        where: { id: lender_id },
        select: { id: true },
      }),
      loan_product_id
        ? prisma.loanProduct.findUnique({
            where: { id: loan_product_id },
            select: { id: true },
          })
        : Promise.resolve(null),
      loan_connection_id
        ? prisma.loan_Connection.findUnique({
            where: { id: loan_connection_id },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (!quote) {
      return res.status(400).json({ error: `Quote not found: ${quote_id}` });
    }
    if (!lender) {
      return res.status(400).json({ error: `Lender not found: ${lender_id}` });
    }
    if (loan_product_id && !loanProduct) {
      return res
        .status(400)
        .json({ error: `Loan product not found: ${loan_product_id}` });
    }
    if (loan_connection_id && !loanConnection) {
      return res
        .status(400)
        .json({ error: `Loan connection not found: ${loan_connection_id}` });
    }

    const created = await prisma.$transaction(
      itemsWithIds.map((item) =>
        prisma.universalTermSheet.create({
          data: {
            // relations via connect
            quote: { connect: { id: item.quote_id } },
            lender: { connect: { id: item.lender_id } },
            ...(item.loan_product_id
              ? { loan_product: { connect: { id: item.loan_product_id } } }
              : {}),
            ...(item.loan_connection_id
              ? {
                  loan_connection: { connect: { id: item.loan_connection_id } },
                }
              : {}),
            // JSON field for term sheet data
            term_sheet_data: item.term_sheet_data as any,
          },
        })
      )
    );

    // Update related loan connection status to available
    if (loan_connection_id) {
      await prisma.loan_Connection.update({
        where: { id: loan_connection_id },
        data: { term_sheet_status: TermSheetStatus.pending },
      });
    } else {
      // Try to find a matching loan connection using provided IDs
      const found = await prisma.loan_Connection.findFirst({
        where: {
          quote_id,
          lender_id,
          ...(loan_product_id ? { loan_product_id } : {}),
        },
        select: { id: true },
      });
      if (found) {
        await prisma.loan_Connection.update({
          where: { id: found.id },
          data: { term_sheet_status: TermSheetStatus.available },
        });
      }
    }

    return res.status(201).json(created);
  } catch (error) {
    console.error("Error creating universal term sheets:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUniversalTermSheets = async (req: Request, res: Response) => {
  try {
    const result = await PaginationService.paginate(
      prisma.universalTermSheet,
      req,
      {
        pagination: {
          page: req.query.page as string,
          limit: req.query.limit as string,
        },
        where: {},
        orderBy: { created_at: "desc" },
      }
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error listing universal term sheets:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUniversalTermSheetsByQuote = async (
  req: Request,
  res: Response
) => {
  try {
    const quoteId = parseInt(req.params.quoteId);
    const connectionId = parseInt(req.params.connectionId);
    if (isNaN(quoteId)) {
      return res.status(400).json({ error: "Invalid quote ID" });
    }
    if (isNaN(connectionId)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }
    const exists = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!exists) {
      return res.status(404).json({ error: "Quote not found" });
    }
    const connection = await prisma.loan_Connection.findUnique({
      where: { id: connectionId },
    });
    if (!connection) {
      return res.status(404).json({ error: "Connection not found" });
    }
    const termSheets = await prisma.universalTermSheet.findMany({
      where: { quote_id: quoteId, loan_connection_id: connectionId },
      orderBy: { created_at: "desc" },
    });
    return res.status(200).json(termSheets);
  } catch (error) {
    console.error("Error getting universal term sheets by quote:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUniversalTermSheetsByLender = async (
  req: Request,
  res: Response
) => {
  try {
    const lenderId = parseInt(req.params.lenderId);
    if (isNaN(lenderId)) {
      return res.status(400).json({ error: "Invalid lender ID" });
    }
    const exists = await prisma.lender.findUnique({ where: { id: lenderId } });
    if (!exists) {
      return res.status(404).json({ error: "Lender not found" });
    }
    const termSheets = await prisma.universalTermSheet.findMany({
      where: { lender_id: lenderId },
      orderBy: { created_at: "desc" },
    });
    return res.status(200).json(termSheets);
  } catch (error) {
    console.error("Error getting universal term sheets by lender:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUniversalTermSheetsByLoanConnection = async (
  req: Request,
  res: Response
) => {
  try {
    const connectionId = parseInt(req.params.connectionId);
    if (isNaN(connectionId)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }
    const exists = await prisma.loan_Connection.findUnique({
      where: { id: connectionId },
    });
    if (!exists) {
      return res.status(404).json({ error: "Loan connection not found" });
    }
    const termSheets = await prisma.universalTermSheet.findMany({
      where: { loan_connection_id: connectionId },
      orderBy: { created_at: "desc" },
    });
    return res.status(200).json(termSheets);
  } catch (error) {
    console.error("Error getting universal term sheets by connection:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// export const updateUniversalTermSheet = async (req: Request, res: Response) => {
//   try {
//     const id = parseInt(req.params.id);
//     if (isNaN(id)) {
//       return res.status(400).json({ error: "Invalid term sheet ID" });
//     }
//     const body = updateSchema.safeParse(req.body);
//     if (!body.success) {
//       return res.status(400).json({ error: body.error.message });
//     }
//     const existing = await prisma.universalTermSheet.findUnique({ where: { id } });
//     if (!existing) {
//       return res.status(404).json({ error: "Universal term sheet not found" });
//     }

//     // Build update data object
//     const updateData: any = {};
//     if (body.data.term_sheet_data !== undefined) {
//       updateData.term_sheet_data = body.data.term_sheet_data;
//     }
//     if (body.data.status !== undefined) {
//       updateData.status = body.data.status;
//     }
//     // Handle relation updates if provided
//     if (body.data.quote_id !== undefined) {
//       updateData.quote = { connect: { id: body.data.quote_id } };
//     }
//     if (body.data.lender_id !== undefined) {
//       updateData.lender = { connect: { id: body.data.lender_id } };
//     }
//     if (body.data.loan_product_id !== undefined) {
//       if (body.data.loan_product_id === null) {
//         updateData.loan_product = { disconnect: true };
//       } else {
//         updateData.loan_product = { connect: { id: body.data.loan_product_id } };
//       }
//     }
//     if (body.data.loan_connection_id !== undefined) {
//       if (body.data.loan_connection_id === null) {
//         updateData.loan_connection = { disconnect: true };
//       } else {
//         updateData.loan_connection = { connect: { id: body.data.loan_connection_id } };
//       }
//     }

//     const updated = await prisma.universalTermSheet.update({
//       where: { id },
//       data: updateData,
//     });
//     return res.status(200).json(updated);
//   } catch (error) {
//     console.error("Error updating universal term sheet:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

export const deleteUniversalTermSheet = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid term sheet ID" });
    }
    const existing = await prisma.universalTermSheet.findUnique({
      where: { id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Universal term sheet not found" });
    }
    await prisma.universalTermSheet.delete({ where: { id } });
    return res.status(200).json({ message: "Universal term sheet deleted" });
  } catch (error) {
    console.error("Error deleting universal term sheet:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTermSheetStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid term sheet ID" });
    }
    const { status } = req.body;
    var tuUpdateStatus: UniversalTermSheetStatus;
    if (status === "approved") {
      tuUpdateStatus = UniversalTermSheetStatus.approved;
    } else if (status === "rejected") {
      tuUpdateStatus = UniversalTermSheetStatus.closed;
    } else {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Get the term sheet to find its loan_connection_id
    const termSheet = await prisma.universalTermSheet.findUnique({
      where: { id },
      select: { loan_connection_id: true },
    });

    if (!termSheet) {
      return res.status(404).json({ error: "Universal term sheet not found" });
    }

    // Update the term sheet status
    await prisma.universalTermSheet.update({
      where: { id },
      data: { status: tuUpdateStatus },
    });

    // If this term sheet has a loan_connection, update its status based on all term sheets
    if (termSheet.loan_connection_id) {
      // Get all term sheets for this loan connection
      const allTermSheets = await prisma.universalTermSheet.findMany({
        where: { loan_connection_id: termSheet.loan_connection_id },
        select: { status: true },
      });

      // Check if all are approved
      const allApproved = allTermSheets.every(
        (ts) => ts.status === UniversalTermSheetStatus.approved
      );

      // Check if all are closed
      const allClosed = allTermSheets.every(
        (ts) => ts.status === UniversalTermSheetStatus.closed
      );

      // Update loan_connection term_sheet_status
      if (allApproved) {
        await prisma.loan_Connection.update({
          where: { id: termSheet.loan_connection_id },
          data: { term_sheet_status: TermSheetStatus.available },
        });
      } else if (allClosed) {
        await prisma.loan_Connection.update({
          where: { id: termSheet.loan_connection_id },
          data: { term_sheet_status: TermSheetStatus.closed },
        });
      }
    }

    return res
      .status(200)
      .json({ message: "Universal term sheet status updated" });
  } catch (error) {
    console.error("Error updating term sheet status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
