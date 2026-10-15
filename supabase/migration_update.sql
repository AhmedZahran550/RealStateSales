-- ==========================================================
-- كود التحديث والترحيل لقاعدة البيانات الحالية (Database Migration Script)
-- ينفذ التعديلات المطلوبة على قاعدة بيانات موجودة مسبقاً
-- ==========================================================

-- 1. حذف جداول الخدمات ودليل الخدمات غير المطلوبة
drop table if exists building_services cascade;
drop table if exists zone_services cascade;
drop table if exists services cascade;

-- 2. إضافة حقل مميزات المبنى في جدول المباني
alter table buildings add column if not exists features text[] default '{}';

-- 3. تحديث جدول الوحدات (إلغاء owner_id و services وإضافة features)
alter table units drop column if exists owner_id cascade;
alter table units drop column if exists services cascade;
alter table units add column if not exists features text[] default '{}';

-- 4. تحديث جدول العملاء (إلغاء company_id ليتبع العميل للوسيط فقط)
alter table customers drop column if exists company_id cascade;

-- 5. إنشاء جدول سجل تعديلات وتاريخ الوحدات (Unit History)
create table if not exists unit_history (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  changed_by uuid references profiles(id) on delete set null,
  change_type text not null, -- 'status_change', 'price_change', 'details_update', 'created'
  old_status unit_status,
  new_status unit_status,
  details text,
  changes jsonb,
  created_at timestamptz default now()
);

-- 6. تفعيل الحماية وفهارس الأداء لسجل التعديلات
alter table unit_history enable row level security;

create policy "Company members view unit history" on unit_history
  for select using (
    exists (
      select 1 from units u 
      where u.id = unit_history.unit_id 
      and (u.company_id = get_auth_company_id() or is_super_admin())
    )
  );

create policy "Authorized users insert unit history" on unit_history
  for insert with check (
    exists (
      select 1 from units u 
      where u.id = unit_history.unit_id 
      and (u.company_id = get_auth_company_id() or is_super_admin())
    )
  );

create index if not exists idx_unit_history_unit on unit_history(unit_id, created_at desc);
