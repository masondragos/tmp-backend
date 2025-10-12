import { Request, Response } from "express";
import { EmployeeStatus, PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PaginationService } from "../utils/pagination";
import { getCreateUpdateLoanProductSchema } from "../schemas/lender/loan-products";

const prisma = new PrismaClient().$extends(withAccelerate());

// Validation schemas


// Loan Product Controllers
export const createLoanProduct = async (req: Request, res: Response) => {
  try {
    if(req.body.appraisal_required === undefined){
      return res.status(400).json({ error: "Appraisal required is required" });
    }
    const body = getCreateUpdateLoanProductSchema(Boolean(req.body.appraisal_required)).safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }
    const lender_id = (req.user as any).id;
    // Verify lender exists
    const lender = await prisma.lender.findUnique({
      where: { id: lender_id },
    });

    if (!lender) {
      return res.status(404).json({ error: "Lender not found" });
    }

    // Extract criteria data from the request
    const { 
      name, 
      description,
      max_loan_amount,
      min_loan_amount,
      citizenship_requirement,
      seasoning_period_months,
      appraisal_required,
      appraisal_type,
      states_funded,
      active,
      ...productData 
    } = body.data;

    // Create loan product and criteria in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the loan product
      const loanProduct = await tx.loanProduct.create({
        data: {
          lender_id,
          name,
          description,
          active,
        },
      });

      // Create criteria if any criteria data is provided
      let criteria = null;
      if (max_loan_amount || min_loan_amount || citizenship_requirement || 
          seasoning_period_months !== undefined || appraisal_required !== undefined || 
          appraisal_type || states_funded) {
        
        criteria = await tx.loanCriteria.create({
          data: {
            loan_product_id: loanProduct.id,
            max_loan_amount,
            min_loan_amount,
            citizenship_requirement,
            seasoning_period_months,
            appraisal_required,
            appraisal_type,
            states_funded: states_funded ? JSON.stringify(states_funded) : undefined,
          },
        });
      }

      // Fetch the complete product with relationships
      const completeProduct = await tx.loanProduct.findUnique({
        where: { id: loanProduct.id },
        include: {
          lender: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              contact_email: true,
              phone: true,
              website: true,
            },
          },
          criteria: true,
        },
      });

      return completeProduct;
    });

    // Parse states_funded back to array for response
    // if (result?.criteria && result.criteria.length > 0) {
    //   result.criteria = result.criteria.map(criteria => ({
    //     ...criteria,
    //     states_funded: criteria.states_funded ? JSON.parse(criteria.states_funded as string) : null,
    //   }));
    // }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating loan product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLoanProducts = async (req: Request, res: Response) => {
  try {
    const lender_id = (req.user as any).id;
    if(!lender_id){
      return res.status(400).json({ error: "Lender not found" });
    }
    const result = await PaginationService.paginate(prisma.loanProduct, req, {
      pagination: {
        page: req.query.page as string,
        limit: req.query.limit as string,
      },
      search: {
        search: req.query.search as string,
        searchFields: ["name", "description"],
      },
      where: { lender_id },
      include: {
        lender: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        criteria: true,
      },
    });

    // Parse states_funded back to array for response
    // if (result.data && Array.isArray(result.data)) {
    //   result.data = result.data.map((product: any) => ({
    //     ...product,
    //     criteria: product.criteria ? product.criteria.map((criteria: any) => ({
    //       ...criteria,
    //       states_funded: criteria.states_funded ? JSON.parse(criteria.states_funded as string) : null,
    //     })) : [],
    //   }));
    // }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting loan products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLoanProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lender_id = (req.user as any).id;
    if(!lender_id){
      return res.status(400).json({ error: "Lender not found" });
    }
    const loanProduct = await prisma.loanProduct.findUnique({
      where: { id: parseInt(id) },
      include: {
        lender: true,
        criteria: true,
      },
    });

    if (!loanProduct) {
      return res.status(404).json({ error: "Loan product not found" });
    }

    // Parse states_funded back to array for response
    // const response = {
    //   ...loanProduct,
    //   criteria: loanProduct.criteria ? loanProduct.criteria.map(criteria => ({
    //     ...criteria,
    //     states_funded: criteria.states_funded ? JSON.parse(criteria.states_funded as string) : null,
    //   })) : [],
    // };

    res.status(200).json(loanProduct);
  } catch (error) {
    console.error("Error getting loan product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateLoanProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if(req.body.appraisal_required === undefined){
      return res.status(400).json({ error: "Appraisal required is required" });
    }
    const body = getCreateUpdateLoanProductSchema(Boolean(req.body.appraisal_required)).safeParse(req.body);
    
    if (!body.success) {
      return res.status(400).json({ error: body.error.message });
    }

    const existingProduct = await prisma.loanProduct.findUnique({
      where: { id: parseInt(id) },
      include: { criteria: true },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Loan product not found" });
    }

    // Extract criteria data from the request
    const { 
      name, 
      description,
      max_loan_amount,
      min_loan_amount,
      citizenship_requirement,
      seasoning_period_months,
      appraisal_required,
      appraisal_type,
      states_funded,
      active,
      ...productData 
    } = body.data;

    // Update loan product and criteria in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the loan product
      const loanProduct = await tx.loanProduct.update({
        where: { id: parseInt(id) },
        data: {
          name,
          description,
          active,
        },
      });

      // Handle criteria update/creation
      if (max_loan_amount !== undefined || min_loan_amount !== undefined || 
          citizenship_requirement !== undefined || seasoning_period_months !== undefined || 
          appraisal_required !== undefined || appraisal_type !== undefined || 
          states_funded !== undefined) {

        // Check if criteria already exists
        const existingCriteria = existingProduct.criteria 
          ? existingProduct.criteria 
          : null;

        if (existingCriteria) {
          // Update existing criteria
          await tx.loanCriteria.update({
            where: { id: existingCriteria.id },
            data: {
              max_loan_amount,
              min_loan_amount,
              citizenship_requirement,
              seasoning_period_months,
              appraisal_required,
              appraisal_type,
              states_funded: states_funded !== undefined ? (states_funded ? JSON.stringify(states_funded) : undefined) : undefined,
            },
          });
        } else {
          // Create new criteria
          await tx.loanCriteria.create({
            data: {
              loan_product_id: parseInt(id),
              max_loan_amount,
              min_loan_amount,
              citizenship_requirement,
              seasoning_period_months,
              appraisal_required,
              appraisal_type,
              states_funded: states_funded ? JSON.stringify(states_funded) : undefined,
            },
          });
        }
      }

      // Fetch the complete product with relationships
      const completeProduct = await tx.loanProduct.findUnique({
        where: { id: parseInt(id) },
        include: {
          lender: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              contact_email: true,
              phone: true,
              website: true,
            },
          },
          criteria: true,
        },
      });

      return completeProduct;
    });

    // Parse states_funded back to array for response
    // if (result?.criteria) {
    //   result.criteria = result.criteria.map(criteria => ({
    //     ...criteria,
    //     states_funded: criteria.states_funded ? JSON.parse(criteria.states_funded as string) : null,
    //   }));
    // }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating loan product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteLoanProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.loanProduct.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Loan product not found" });
    }

    await prisma.loanProduct.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: "Loan product deleted successfully" });
  } catch (error) {
    console.error("Error deleting loan product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLoanProductsByLender = async (req: Request, res: Response) => {
  try {
    const { lenderId } = req.params;
    
    const lender = await prisma.lender.findUnique({
      where: { id: parseInt(lenderId) },
    });

    if (!lender) {
      return res.status(404).json({ error: "Lender not found" });
    }

    const result = await PaginationService.paginate(prisma.loanProduct, req, {
      pagination: {
        page: req.query.page as string,
        limit: req.query.limit as string,
      },
      where: { lender_id: parseInt(lenderId) },
      include: {
        criteria: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting loan products by lender:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const getBestLoanProducts = async (req: Request, res: Response) => {
    try {
      const { quoteId } = req.params;
      
      if (!quoteId) {
        return res.status(400).json({ error: "Quote ID is required" });
      }
  
      // Get the quote to understand the loan requirements
      const quote = await prisma.quote.findUnique({
        where: { id: parseInt(quoteId), is_draft: false },
        include: {
          quoteApplicantInfo: true,
          quoteLoanDetails: true,
          quotePriorities: true,
          quoteRentalInfo: true,
        },
      });
  
      if (!quote) {
        return res.status(404).json({ error: "Quote not found" });
      }
  
      // Get all active loan products with their criteria
      const loanProducts = await prisma.loanProduct.findMany({
        where: {
          active: true,
          lender: {
            is_active: true,
          }
        },
        include: {
          lender: {
            select: {
              id: true,
              name: true,
              email: true,
              contact_email: true,
              phone: true,
              website: true,
             
            },
          },
          criteria: true,
        },
        orderBy: { created_at: 'desc' },
      });
  
      // Get existing loan connections to exclude already connected products
      const loan_connections = await prisma.loan_Connection.findMany({
        where: { quote_id: parseInt(quoteId) },
        select: { lender_id: true, loan_product_id: true },
      });
      const loan_product_ids = loan_connections.map(connection => connection.loan_product_id);
      
      // Filter by loan type - product name should match the quote's loan type
      const filteredLoanProducts = loanProducts.filter(product => {
        // Exclude already connected products
        if (loan_product_ids.includes(product.id)) {
          return false;
        }

        // Filter by loan type
        if (quote.loan_type && product.name) {
          const productNameLower = product.name.toLowerCase().replace(/[_\s-]/g, "");
          const loanTypeLower = quote.loan_type.toLowerCase().replace(/[_\s-]/g, "");
          
          // Check if product name matches loan type
          if (loanTypeLower.includes("dscr")) {
            return productNameLower.includes("dscr");
          } else if (loanTypeLower.includes("bridge") || loanTypeLower.includes("flip")) {
            return productNameLower.includes("bridge") || productNameLower.includes("flip");
          }
        }
        
        return true; // Include if no loan type specified
      });

      res.status(200).json({
        quote: {
          id: quote.id,
          loan_type: quote.loan_type,
          property_type: quote.property_type,
          address: quote.address,
          requested_loan_amount: quote.quoteLoanDetails?.requested_loan_amount,
        },
        loanProducts: filteredLoanProducts,
      });
    } catch (error) {
      console.error("Error getting Best Loan Products:", error);
      res.status(500).json({ error: "Internal server error" });
    }
}