-- ==============================================================================
-- إضافة حقل التبعية والمطور (belong_to - خاص بـ) لجدول الوحدات
-- ==============================================================================

-- 1. إضافة عمود belong_to لجدول units
ALTER TABLE units ADD COLUMN IF NOT EXISTS belong_to text;

-- 2. تحديث السجلات الحالية ليكون الافتراضي اسم الشركة التابعة لها
UPDATE units u
SET belong_to = c.name
FROM companies c
WHERE u.company_id = c.id
  AND (u.belong_to IS NULL OR trim(u.belong_to) = '');

-- 3. إضافة تعليق توضيحي للعمود
COMMENT ON COLUMN units.belong_to IS 'الجهة المالكة أو التابعة لها الوحدة (مطور خارجي، مكتب مبيعات، أو محفظة الشركة)';

