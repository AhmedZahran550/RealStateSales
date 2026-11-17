-- ==============================================================================
-- Migration: Shared CRM and Employee Unit Management
-- Description:
-- 1. Adds company_id to customers table to support team-wide / company-level CRM.
-- 2. Indexes company_id for high-performance scoped queries.
-- 3. Backfills existing customers with their creator's company_id.
-- ==============================================================================

-- 1. إضافة حقل company_id لجدول العملاء (customers)
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE CASCADE;

-- 2. فهرسة حقل company_id لتسريع الاستعلامات والفلترة
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);

-- 3. ترحيل وربط العملاء الحاليين بشركات أصحابهم (Profiles)
UPDATE customers c
SET company_id = p.company_id
FROM profiles p
WHERE c.owner_id = p.id
  AND c.company_id IS NULL
  AND p.company_id IS NOT NULL;
