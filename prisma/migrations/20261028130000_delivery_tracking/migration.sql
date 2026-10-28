ALTER TABLE "Order"
  ADD COLUMN "deliveryStatus" TEXT NOT NULL DEFAULT 'NOT_SCHEDULED',
  ADD COLUMN "deliveredAt" TIMESTAMP(3);

CREATE TABLE "DeliveryEvent" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeliveryEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DeliveryEvent_orderId_createdAt_idx" ON "DeliveryEvent"("orderId", "createdAt");
CREATE INDEX "DeliveryEvent_actorUserId_idx" ON "DeliveryEvent"("actorUserId");

ALTER TABLE "DeliveryEvent"
  ADD CONSTRAINT "DeliveryEvent_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DeliveryEvent"
  ADD CONSTRAINT "DeliveryEvent_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
