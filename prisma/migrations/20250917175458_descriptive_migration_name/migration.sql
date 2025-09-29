-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('bridge_fix_and_flip', 'dscr_rental');

-- CreateEnum
CREATE TYPE "ExitPlan" AS ENUM ('refiance', 'sell');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "google_id" TEXT,
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "address" TEXT,
    "is_living_in_property" BOOLEAN NOT NULL,
    "loan_type" "LoanType",

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote_Applicant_Info" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "quote_id" INTEGER NOT NULL,
    "full_name" TEXT,
    "citizenship" TEXT,
    "company_name" TEXT,
    "company_ein" TEXT,
    "liquid_funds_available" TEXT,
    "company_founded_at" TIMESTAMP(3),
    "properties_owned" INTEGER,
    "total_equity_value" TEXT,
    "total_debt_value" TEXT,
    "credit_score" INTEGER,
    "phone_number" TEXT,
    "whats_most_important" TEXT,

    CONSTRAINT "Quote_Applicant_Info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote_Loan_Details" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "quote_id" INTEGER NOT NULL,
    "purpose_of_loan" TEXT,
    "purchase_price" TEXT,
    "contract_close_date" TIMESTAMP(3),
    "has_rehab_funds_requested" BOOLEAN,
    "after_repair_property_value" TEXT,
    "exit_plan" "ExitPlan",
    "completed_fix_and_flips_2_years" TEXT,
    "as_is_property_value" TEXT,
    "seller_concessions" INTEGER,
    "assignment_fees" BOOLEAN,
    "has_tenant" BOOLEAN,
    "funding_reason" TEXT,
    "properties_owned" TEXT,
    "property_purchase_date" TIMESTAMP(3),
    "mortgage_remaining" TEXT,
    "current_property_value" TEXT,
    "requested_loan_amount" TEXT,

    CONSTRAINT "Quote_Loan_Details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote_Rental_Info" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "loan_amount" TEXT,
    "monthly_rental_income" TEXT,
    "annual_property_insurance" TEXT,
    "annual_property_taxes" TEXT,
    "monthly_hoa_fee" TEXT,
    "quote_id" INTEGER NOT NULL,

    CONSTRAINT "Quote_Rental_Info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_Applicant_Info_quote_id_key" ON "Quote_Applicant_Info"("quote_id");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_Loan_Details_quote_id_key" ON "Quote_Loan_Details"("quote_id");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_Rental_Info_quote_id_key" ON "Quote_Rental_Info"("quote_id");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote_Applicant_Info" ADD CONSTRAINT "Quote_Applicant_Info_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote_Loan_Details" ADD CONSTRAINT "Quote_Loan_Details_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote_Rental_Info" ADD CONSTRAINT "Quote_Rental_Info_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
