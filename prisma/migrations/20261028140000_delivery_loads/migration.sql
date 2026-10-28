CREATE TABLE "DeliveryLoad" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "plannedQuantityM3" DOUBLE PRECISION NOT NULL,
  "receivedQuantityM3" DOUBLE PRECISION,
  "truckNumber" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "note" TEXT,
  "dispatchedAt" TIMESTAMP(3),
  "arrivedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliveryLoad_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeliveryLoad_orderId_sequence_key" ON "DeliveryLoad"("orderId", "sequence");
CREATE INDEX "DeliveryLoad_orderId_status_idx" ON "DeliveryLoad"("orderId", "status");

ALTER TABLE "DeliveryLoad"
  ADD CONSTRAINT "DeliveryLoad_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
