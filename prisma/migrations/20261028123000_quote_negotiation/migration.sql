CREATE TABLE "QuoteMessage" (
  "id" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "senderUserId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "attachmentUrl" TEXT,
  "attachmentName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuoteMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuoteMessage_quoteId_createdAt_idx" ON "QuoteMessage"("quoteId", "createdAt");
CREATE INDEX "QuoteMessage_senderUserId_idx" ON "QuoteMessage"("senderUserId");

ALTER TABLE "QuoteMessage"
  ADD CONSTRAINT "QuoteMessage_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuoteMessage"
  ADD CONSTRAINT "QuoteMessage_senderUserId_fkey"
  FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
