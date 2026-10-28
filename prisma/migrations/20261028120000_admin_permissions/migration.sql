-- Add configurable access control for administrative employees.
ALTER TABLE "User"
  ADD COLUMN "adminGrade" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "permissions" TEXT;
