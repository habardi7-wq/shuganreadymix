CREATE TABLE "Complaint" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "deliveryLoadId" TEXT,
  "reporterUserId" TEXT NOT NULL,
  "handlerUserId" TEXT,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "requestedAdjustmentSar" DOUBLE PRECISION,
  "approvedAdjustmentSar" DOUBLE PRECISION,
  "resolutionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "closedAt" TIMESTAMP(3),
  CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Complaint_orderId_status_idx" ON "Complaint"("orderId", "status");
CREATE INDEX "Complaint_reporterUserId_createdAt_idx" ON "Complaint"("reporterUserId", "createdAt");
CREATE INDEX "Complaint_status_createdAt_idx" ON "Complaint"("status", "createdAt");
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_deliveryLoadId_fkey" FOREIGN KEY ("deliveryLoadId") REFERENCES "DeliveryLoad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_handlerUserId_fkey" FOREIGN KEY ("handlerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
