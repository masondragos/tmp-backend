import { Request, Response } from "express";
import { PrismaClient, TermSheetStatus } from "@prisma/client";
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

  loan_amount: z.string().or(z.number()).optional(),
  interest_rate: z.number().optional(),
  term_months: z.number().int().positive().optional(),
  origination_fee: z.string().or(z.number()).optional(),
  appraisal_fees: z.string().or(z.number()).optional(),
  total_lender_fees: z.string().or(z.number()).optional(),
  dscr: z.number().optional(),
  arv_estimate: z.string().or(z.number()).optional(),
  exit_strategy: z.string().optional(),
  status: z.string().optional(),
});

// New: top-level schema requiring common IDs once
const bulkCreateWithCommonIdsSchema = z.object({
  quote_id: z.number().int().positive(),
  lender_id: z.number().int().positive(),
  loan_product_id: z.number().int().positive().optional(),
  loan_connection_id: z.number().int().positive().optional(),
  items: z.array(baseTermSheetSchema).min(1),
});

// Back-compat: allow items where each object has the IDs
const bulkCreateSchema = z.object({
  items: z.array(
    baseTermSheetSchema.extend({
      quote_id: z.number().int().positive(),
      lender_id: z.number().int().positive(),
    })
  ).min(1),
});

const updateSchema = baseTermSheetSchema.partial();

export const createUniversalTermSheets = async (req: Request, res: Response) => {
  try {
    // Normalize request shape: accept either array or object with items
    const normalized = Array.isArray(req.body) ? { items: req.body } : req.body;

    // Try new schema with top-level common IDs first
    const withCommon = bulkCreateWithCommonIdsSchema.safeParse(normalized);
    let items: z.infer<typeof baseTermSheetSchema>[] = [];
    let commonIds: { quote_id: number; lender_id: number; loan_product_id?: number; loan_connection_id?: number } | null = null;

    if (withCommon.success) {
      commonIds = {
        quote_id: withCommon.data.quote_id,
        lender_id: withCommon.data.lender_id,
        loan_product_id: withCommon.data.loan_product_id,
        loan_connection_id: withCommon.data.loan_connection_id,
      };
      // Merge common IDs into each item, validate consistency if provided in item
      items = withCommon.data.items.map((i) => {
        if (i.quote_id && i.quote_id !== commonIds!.quote_id) {
          throw new Error("Item quote_id must match top-level quote_id");
        }
        if (i.lender_id && i.lender_id !== commonIds!.lender_id) {
          throw new Error("Item lender_id must match top-level lender_id");
        }
        if (
          i.loan_product_id &&
          commonIds!.loan_product_id &&
          i.loan_product_id !== commonIds!.loan_product_id
        ) {
          throw new Error("Item loan_product_id must match top-level loan_product_id");
        }
        if (
          i.loan_connection_id &&
          commonIds!.loan_connection_id &&
          i.loan_connection_id !== commonIds!.loan_connection_id
        ) {
          throw new Error("Item loan_connection_id must match top-level loan_connection_id");
        }
        return {
          ...i,
          quote_id: commonIds!.quote_id,
          lender_id: commonIds!.lender_id,
          loan_product_id: commonIds!.loan_product_id ?? i.loan_product_id,
          loan_connection_id: commonIds!.loan_connection_id ?? i.loan_connection_id,
        };
      });
    } else {
      // Fallback: require IDs inside each item
      const withPerItemIds = bulkCreateSchema.safeParse(normalized);
      if (!withPerItemIds.success) {
        return res.status(400).json({ error: withCommon.error.message });
      }
      items = withPerItemIds.data.items;
      // Optionally infer common IDs for connection status update
      const qIds = new Set<number>(items.map(i => i.quote_id!));
      const lIds = new Set<number>(items.map(i => i.lender_id!));
      const lpIds = new Set<number>(items.map(i => i.loan_product_id!).filter((v): v is number => !!v));
      const lcIds = new Set<number>(items.map(i => i.loan_connection_id!).filter((v): v is number => !!v));
      if (qIds.size === 1 && lIds.size === 1) {
        commonIds = {
          quote_id: Array.from(qIds)[0]!,
          lender_id: Array.from(lIds)[0]!,
          loan_product_id: lpIds.size === 1 ? Array.from(lpIds)[0] : undefined,
          loan_connection_id: lcIds.size === 1 ? Array.from(lcIds)[0] : undefined,
        };
      }
    }

    // Validate referenced entities exist (best-effort batch check)
    const uniqueQuoteIds = Array.from(new Set(items.map(i => i.quote_id!)));
    const uniqueLenderIds = Array.from(new Set(items.map(i => i.lender_id!)));
    const uniqueLoanProductIds = Array.from(new Set(items.map(i => i.loan_product_id).filter(Boolean) as number[]));
    const uniqueLoanConnectionIds = Array.from(new Set(items.map(i => i.loan_connection_id).filter(Boolean) as number[]));

    const [quotes, lenders, loanProducts, loanConnections] = await Promise.all([
      prisma.quote.findMany({ where: { id: { in: uniqueQuoteIds } }, select: { id: true } }),
      prisma.lender.findMany({ where: { id: { in: uniqueLenderIds } }, select: { id: true } }),
      uniqueLoanProductIds.length ? prisma.loanProduct.findMany({ where: { id: { in: uniqueLoanProductIds } }, select: { id: true } }) : Promise.resolve([]),
      uniqueLoanConnectionIds.length ? prisma.loan_Connection.findMany({ where: { id: { in: uniqueLoanConnectionIds } }, select: { id: true } }) : Promise.resolve([]),
    ]);

    const quoteIdSet = new Set(quotes.map(q => q.id));
    const lenderIdSet = new Set(lenders.map(l => l.id));
    const loanProductIdSet = new Set(loanProducts.map(lp => lp.id));
    const loanConnectionIdSet = new Set(loanConnections.map(lc => lc.id));

    for (const item of items) {
      if (!quoteIdSet.has(item.quote_id!)) {
        return res.status(400).json({ error: `Quote not found: ${item.quote_id}` });
      }
      if (!lenderIdSet.has(item.lender_id!)) {
        return res.status(400).json({ error: `Lender not found: ${item.lender_id}` });
      }
      if (item.loan_product_id && !loanProductIdSet.has(item.loan_product_id)) {
        return res.status(400).json({ error: `Loan product not found: ${item.loan_product_id}` });
      }
      if (item.loan_connection_id && !loanConnectionIdSet.has(item.loan_connection_id)) {
        return res.status(400).json({ error: `Loan connection not found: ${item.loan_connection_id}` });
      }
    }

    const created = await prisma.$transaction(
      items.map((item) =>
        prisma.universalTermSheet.create({
          data: {
            // relations via connect
            quote: { connect: { id: item.quote_id! } },
            lender: { connect: { id: item.lender_id! } },
            ...(item.loan_product_id
              ? { loan_product: { connect: { id: item.loan_product_id } } }
              : {}),
            ...(item.loan_connection_id
              ? { loan_connection: { connect: { id: item.loan_connection_id } } }
              : {}),
            // scalar fields
            loan_amount: item.loan_amount as any,
            interest_rate: item.interest_rate,
            term_months: item.term_months,
            origination_fee: item.origination_fee as any,
            appraisal_fees: item.appraisal_fees as any,
            total_lender_fees: item.total_lender_fees as any,
            dscr: item.dscr,
            arv_estimate: item.arv_estimate as any,
            exit_strategy: item.exit_strategy,
            status: item.status,
          },
        })
      )
    );

    // Update related loan connection status to available
    if (commonIds) {
      if (commonIds.loan_connection_id) {
        await prisma.loan_Connection.update({
          where: { id: commonIds.loan_connection_id },
          data: { term_sheet_status: TermSheetStatus.available },
        });
      } else {
        // Try to find a matching loan connection using provided common IDs
        const found = await prisma.loan_Connection.findFirst({
          where: {
            quote_id: commonIds.quote_id,
            lender_id: commonIds.lender_id,
            ...(commonIds.loan_product_id ? { loan_product_id: commonIds.loan_product_id } : {}),
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

export const getUniversalTermSheetsByQuote = async (req: Request, res: Response) => {
  try {
    const quoteId = parseInt(req.params.quoteId);
    if (isNaN(quoteId)) {
      return res.status(400).json({ error: "Invalid quote ID" });
    }
    const exists = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!exists) {
      return res.status(404).json({ error: "Quote not found" });
    }
    const termSheets = await prisma.universalTermSheet.findMany({
      where: { quote_id: quoteId },
      orderBy: { created_at: "desc" },
    });
    return res.status(200).json(termSheets);
  } catch (error) {
    console.error("Error getting universal term sheets by quote:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUniversalTermSheetsByLender = async (req: Request, res: Response) => {
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

export const getUniversalTermSheetsByLoanConnection = async (req: Request, res: Response) => {
  try {
    const connectionId = parseInt(req.params.connectionId);
    if (isNaN(connectionId)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }
    const exists = await prisma.loan_Connection.findUnique({ where: { id: connectionId } });
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

export const updateUniversalTermSheet = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid term sheet ID" });
    }
    const body = updateSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }
    const existing = await prisma.universalTermSheet.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Universal term sheet not found" });
    }
    const updated = await prisma.universalTermSheet.update({
      where: { id },
      data: body.data,
    });
    return res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating universal term sheet:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUniversalTermSheet = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid term sheet ID" });
    }
    const existing = await prisma.universalTermSheet.findUnique({ where: { id } });
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


