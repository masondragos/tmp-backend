import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

interface DisqualificationReason {
  field: string;
  reason: string;
  lenderValue: any;
  quoteValue: any;
}

interface MatchResult {
  lender_id: number;
  loan_product_id: number;
  match_status: 'qualified' | 'disqualified';
  disqualification_reasons: DisqualificationReason[];
}

export async function matchQuoteToLenders(quoteId: number): Promise<MatchResult[]> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      quoteApplicantInfo: true,
      quoteLoanDetails: true,
      quoteRentalInfo: true,
    },
  });

  if (!quote) {
    throw new Error('Quote not found');
  }

  const loanProducts = await prisma.lender_Loan_Product.findMany({
    where: {
      loan_type: quote.loan_type || undefined,
    },
    include: {
      lender: true,
    },
  });

  const results: MatchResult[] = [];

  for (const product of loanProducts) {
    const disqualifications: DisqualificationReason[] = [];

    // 1. Check loan amount
    const requestedAmountStr = quote.quoteLoanDetails?.requested_loan_amount;
    
    if (!requestedAmountStr || !quote.quoteLoanDetails) {
      disqualifications.push({
        field: 'loan_details',
        reason: 'Quote is missing loan details required for matching',
        lenderValue: 'required',
        quoteValue: 'missing',
      });
    } else {
      const requestedAmount = parseFloat(requestedAmountStr);
      
      if (isNaN(requestedAmount)) {
        disqualifications.push({
          field: 'loan_amount',
          reason: 'Invalid loan amount format',
          lenderValue: 'valid number',
          quoteValue: requestedAmountStr,
        });
      } else {
        if (product.min_loan_amount && requestedAmount < parseFloat(product.min_loan_amount.toString())) {
          disqualifications.push({
            field: 'loan_amount',
            reason: 'Requested loan amount is below lender minimum',
            lenderValue: product.min_loan_amount.toString(),
            quoteValue: requestedAmount,
          });
        }
        if (product.max_loan_amount && requestedAmount > parseFloat(product.max_loan_amount.toString())) {
          disqualifications.push({
            field: 'loan_amount',
            reason: 'Requested loan amount exceeds lender maximum',
            lenderValue: product.max_loan_amount.toString(),
            quoteValue: requestedAmount,
          });
        }
      }
    }

    // 2. Check credit score
    const creditScore = quote.quoteApplicantInfo?.credit_score;
    if (product.min_credit_score && creditScore && creditScore < product.min_credit_score) {
      disqualifications.push({
        field: 'credit_score',
        reason: 'Credit score is below lender minimum',
        lenderValue: product.min_credit_score,
        quoteValue: creditScore,
      });
    }

    // 3. Check citizenship requirements
    const citizenship = quote.quoteApplicantInfo?.citizenship;
    if (product.citizen_requirements.length > 0 && citizenship) {
      const citizenshipMatch = product.citizen_requirements.some(req => 
        citizenship.toLowerCase().includes(req.toLowerCase())
      );
      if (!citizenshipMatch) {
        disqualifications.push({
          field: 'citizenship',
          reason: 'Citizenship type not accepted by lender',
          lenderValue: product.citizen_requirements,
          quoteValue: citizenship,
        });
      }
    }

    // 4. Check states funded
    // Extract state from address if available
    if (product.states_funded.length > 0 && quote.address) {
      const addressParts = quote.address.split(',').map(s => s.trim());
      const stateMatch = addressParts.some(part => 
        product.states_funded.some(state => 
          part.toUpperCase().includes(state.toUpperCase())
        )
      );
      if (!stateMatch) {
        disqualifications.push({
          field: 'state',
          reason: 'Property state not serviced by lender',
          lenderValue: product.states_funded,
          quoteValue: quote.address,
        });
      }
    }

    // 5. Check seasoning period (if property purchase date exists)
    const purchaseDate = quote.quoteLoanDetails?.property_purchase_date;
    if (product.seasoning_period_months && purchaseDate) {
      const monthsSincePurchase = Math.floor(
        (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      if (monthsSincePurchase < product.seasoning_period_months) {
        disqualifications.push({
          field: 'seasoning_period',
          reason: 'Property seasoning period requirement not met',
          lenderValue: `${product.seasoning_period_months} months`,
          quoteValue: `${monthsSincePurchase} months`,
        });
      }
    }

    // 6. Check rehab loans
    const hasRehabFunds = quote.quoteLoanDetails?.has_rehab_funds_requested;
    if (hasRehabFunds && !product.accepts_rehab_loans) {
      disqualifications.push({
        field: 'rehab_loans',
        reason: 'Lender does not accept rehab loans',
        lenderValue: false,
        quoteValue: true,
      });
    }

    // 7. Check LTV (Loan-to-Value) ratio for purchase loans
    if (product.max_ltv_percentage && quote.quoteLoanDetails?.purchase_price) {
      const purchasePrice = parseFloat(quote.quoteLoanDetails.purchase_price);
      const loanAmount = parseFloat(quote.quoteLoanDetails.requested_loan_amount || '0');
      const ltv = (loanAmount / purchasePrice) * 100;
      
      const maxLtv = parseFloat(product.max_ltv_percentage.toString());
      if (ltv > maxLtv) {
        disqualifications.push({
          field: 'ltv_ratio',
          reason: 'Loan-to-value ratio exceeds lender maximum',
          lenderValue: `${maxLtv}%`,
          quoteValue: `${ltv.toFixed(2)}%`,
        });
      }
    }

    results.push({
      lender_id: product.lender_id,
      loan_product_id: product.id,
      match_status: disqualifications.length > 0 ? 'disqualified' : 'qualified',
      disqualification_reasons: disqualifications,
    });
  }

  return results;
}

export async function saveMatchResults(quoteId: number, results: MatchResult[]) {
  const operations = results.map(result =>
    prisma.quote_Lender_Match.upsert({
      where: {
        quote_id_lender_id: {
          quote_id: quoteId,
          lender_id: result.lender_id,
        },
      },
      update: {
        match_status: result.match_status,
        disqualification_reason: result.disqualification_reasons.length > 0
          ? JSON.stringify(result.disqualification_reasons)
          : null,
      },
      create: {
        quote_id: quoteId,
        lender_id: result.lender_id,
        match_status: result.match_status,
        disqualification_reason: result.disqualification_reasons.length > 0
          ? JSON.stringify(result.disqualification_reasons)
          : null,
      },
    })
  );

  await prisma.$transaction(operations);
}

export async function getMatchesForQuote(quoteId: number) {
  const matches = await prisma.quote_Lender_Match.findMany({
    where: { quote_id: quoteId },
    include: {
      lender: {
        select: {
          id: true,
          company_name: true,
          email: true,
          contact_name: true,
          phone_number: true,
        },
      },
    },
    orderBy: {
      match_status: 'asc', // qualified first
    },
  });

  return matches.map(match => ({
    ...match,
    disqualification_reasons: match.disqualification_reason
      ? JSON.parse(match.disqualification_reason)
      : [],
  }));
}
