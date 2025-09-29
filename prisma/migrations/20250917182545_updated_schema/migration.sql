-- AlterTable
ALTER TABLE "Quote_Loan_Details" ADD COLUMN     "has_paid_rent_last_3_months" BOOLEAN,
ADD COLUMN     "has_signed_lease" BOOLEAN,
ADD COLUMN     "how_much_are_they_paying" TEXT,
ADD COLUMN     "market_rent" TEXT;
