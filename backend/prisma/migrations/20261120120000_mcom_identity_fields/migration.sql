-- MCOM Solutions SSO integration: extend the User table with identity columns
-- for MCOM SSO provisioning (see src/mcom/sso.model.ts and Task 4.4 of the
-- mcom-ecosystem-integration skill). Applied to hotspot_db (already contains the
-- mcomUserId/mcom* columns from the environment; the additions below cover the
-- remaining ones).
--
-- Migration: 20261120120000_mcom_identity_fields

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "jobTitle" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "postcode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAffiliate" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyType" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyIndustry" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyWebsite" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyLogo" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mcomBusinessProfile" JSONB;
