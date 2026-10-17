-- ==============================================================================
-- مشروع الواحة (El Waha / Brokers App)
-- سكريبت حذف الجداول غير المستخدمة في قاعدة بيانات Supabase (PostgreSQL)
-- معرف المشروع (Project Ref): ulgvczgdvwbjdznvyjks
-- ==============================================================================
-- تنبيه: قم بتشغيل هذا الاستعلام في محرر SQL في لوحة تحكم سوبابيز:
-- https://supabase.com/dashboard/project/ulgvczgdvwbjdznvyjks/sql
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. جداول الخدمات والمرافق الملغاة (Deprecated Services system in Brokers App)
-- تم إلغاء هذه الجداول واستبدالها بنظام مصفوفات المميزات (features text[]) في المباني والوحدات
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS building_services CASCADE;
DROP TABLE IF EXISTS zone_services CASCADE;
DROP TABLE IF EXISTS services CASCADE;

-- ------------------------------------------------------------------------------
-- 2. الجداول القديمة المتبقية من مشروع/قالب التصنيع والورديات السابق
-- (Leftover tables from old industrial / shift management SaaS template)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS location_departments CASCADE;
DROP TABLE IF EXISTS operator_departments CASCADE;
DROP TABLE IF EXISTS department_settings CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

DROP TABLE IF EXISTS downtime_reasons CASCADE;
DROP TABLE IF EXISTS downtime_categories CASCADE;

DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS operators CASCADE;
DROP TABLE IF EXISTS products CASCADE;

DROP TABLE IF EXISTS organization_invitations CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;

DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

-- جدول المستخدمين القديم الخاص بالقالب السابق (public.users) المنفصل تماماً عن auth.users و profiles
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS locations CASCADE;

COMMIT;

-- ==============================================================================
-- الجداول الفعلية النشطة والمستخدمة في مشروع تطبيق الواحة (التي تم الحفاظ عليها ولم تُحذف):
-- 1. companies           (الشركات العقارية المشتركة في المنظومة)
-- 2. profiles            (الملفات الشخصية للمستخدمين والوسطاء مرتبطة بـ auth.users)
-- 3. zones               (مناطق الحي المتميز 1 إلى 16)
-- 4. buildings           (المباني والقطع مع مميزات المبنى)
-- 5. units               (الوحدات العقارية)
-- 6. unit_media          (معرض صور وفيديوهات الوحدات)
-- 7. customers           (إدارة العملاء CRM)
-- 8. customer_units      (ربط العملاء بالوحدات المهتمين بها)
-- 9. customer_activities (سجل متابعات وتواصل العملاء)
-- (بالإضافة لجدول unit_history المخصص لسجل تعديلات الوحدات في التحديث الجديد)
-- ==============================================================================
