-- CreateTable
CREATE TABLE "Quote_Priorities" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "quote_id" INTEGER NOT NULL,
    "speed_of_closing" BOOLEAN,
    "low_fees" BOOLEAN,
    "high_leverage" BOOLEAN,

    CONSTRAINT "Quote_Priorities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quote_Priorities_quote_id_key" ON "Quote_Priorities"("quote_id");

-- AddForeignKey
ALTER TABLE "Quote_Priorities" ADD CONSTRAINT "Quote_Priorities_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
