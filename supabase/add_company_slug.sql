-- ==============================================================================
-- إضافة المعرف الفريد للرابط العام لكل شركة (Company Public Slug)
--
-- ينفَّذ في محرر SQL بـ Supabase (SQL Editor).
-- يتيح للشركات امتلاك رابط عام نظيف مثل:
--   * صفحة الشركة: /c/elwaha
--   * تفاصيل الوحدة: /c/elwaha/u/[unitId]
-- ==============================================================================

BEGIN;

-- 1. إضافة عمود المعرف الفريد (slug)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- 2. إسناد معرف افتراضي لشركة الواحة الحالية لتعمل الروابط المخصصة فوراً
UPDATE companies 
SET slug = 'elwaha' 
WHERE slug IS NULL AND (
  commercial_name ILIKE '%الواحة%' 
  OR name ILIKE '%elwaha%' 
  OR name ILIKE '%الواحة%'
);

-- 3. فهرس بحث لتسريع استرجاع الصفحات العامة بالاسم المخصص
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);

COMMIT;

