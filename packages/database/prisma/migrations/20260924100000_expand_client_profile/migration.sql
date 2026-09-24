ALTER TABLE "clients"
  ADD COLUMN "city" TEXT,
  ADD COLUMN "income_type" TEXT,
  ADD COLUMN "occupation" TEXT,
  ADD COLUMN "workplace" TEXT,
  ADD COLUMN "monthly_income" DECIMAL(14,2),
  ADD COLUMN "work_tenure" TEXT,
  ADD COLUMN "guarantor_name" TEXT,
  ADD COLUMN "guarantor_relation" TEXT,
  ADD COLUMN "guarantor_phone" TEXT,
  ADD COLUMN "guarantor_identification" TEXT,
  ADD COLUMN "reference_name" TEXT,
  ADD COLUMN "reference_phone" TEXT,
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
