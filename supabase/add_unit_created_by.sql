-- ==============================================================================
-- Migration: Add created_by to units and backfill historical creators
-- Description:
-- 1. Adds created_by column (UUID) referencing profiles(id) ON DELETE SET NULL.
-- 2. Ensures foreign key constraint is named units_created_by_fkey.
-- 3. Creates index on units(created_by) for filtering and group-by performance.
-- 4. Backfills created_by from unit_history ('created' change_type or earliest record).
-- ==============================================================================

-- 1. إضافة عمود created_by لجدول units مع ربطه بجدول profiles
ALTER TABLE units 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- التأكد من وجود قيد المفتاح الأجنبي بالاسم القياسي units_created_by_fkey لدعم علاقات PostgREST
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'units_created_by_fkey'
  ) THEN
    ALTER TABLE units 
      ADD CONSTRAINT units_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. فهرسة حقل created_by لتسريع الاستعلامات والتجميع (Group-By)
CREATE INDEX IF NOT EXISTS idx_units_created_by ON units(created_by);

-- 3. ترحيل البيانات التاريخية من سجل التعديلات unit_history
-- الأولوية لسجل الإنشاء (change_type = 'created') ثم أقدم سجل تعديل زمني للوحدة
UPDATE units u
SET created_by = sub.changed_by
FROM (
  SELECT DISTINCT ON (unit_id)
    unit_id,
    changed_by
  FROM unit_history
  WHERE changed_by IS NOT NULL
  ORDER BY 
    unit_id,
    (CASE WHEN change_type = 'created' THEN 0 ELSE 1 END),
    created_at ASC
) sub
WHERE u.id = sub.unit_id
  AND u.created_by IS NULL;

-- 4. إضافة تعليق توضيحي للعمود
COMMENT ON COLUMN units.created_by IS 'معرف المستخدم (الوسيط أو المدير) الذي قام بإنشاء/إضافة الوحدة';
