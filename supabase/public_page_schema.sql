-- ==========================================================
-- الصفحة العامة للشركات (Public Company Page)
-- جداول: إعدادات الصفحة العامة | أعمال سابقة (المعرض) | الحجوزات العامة
-- ==========================================================

-- 1. أنواع جديدة
DO $$ BEGIN
  CREATE TYPE public_reservation_status AS ENUM ('new', 'claimed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE day_period AS ENUM ('morning', 'afternoon', 'evening');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 0. دوال الصلاحيات المساعدة (تُنشأ إذا لم تكن موجودة من ملف المخطط الأساسي)
create or replace function is_super_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function get_auth_company_id()
returns uuid language sql security definer as $$
  select company_id from profiles where id = auth.uid();
$$;

create or replace function is_company_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and (role = 'company_admin' or role = 'admin' or role = 'super_admin')
  );
$$;

-- 2. إعدادات الصفحة العامة لكل شركة (حقول اختيارية للإظهار)
create table if not exists company_public_settings (
  company_id uuid primary key references companies(id) on delete cascade,
  is_enabled boolean not null default false,          -- تفعيل / إيقاف الصفحة العامة
  show_price boolean not null default true,           -- إظهار السعر
  show_area boolean not null default true,            -- إظهار المساحة
  show_floor boolean not null default true,           -- إظهار الدور
  show_garden boolean not null default true,          -- إظهار مساحة الحديقة
  show_features boolean not null default true,        -- إظهار المميزات
  show_description boolean not null default true,     -- إظهار الوصف
  show_delivery boolean not null default true,        -- إظهار ملاحظات التسليم
  show_payment boolean not null default true,         -- إظهار نظام السداد
  updated_at timestamptz default now()
);

-- 3. معرض أعمال سابقة (سواء أُضيف يدوياً أو تلقائياً عند بيع وحدة)
create table if not exists company_gallery_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  building_id bigint references buildings(id) on delete set null,  -- المبنى (القطعة) — سابقة الأعمال = مبانٍ
  unit_id uuid references units(id) on delete set null,  -- مرتبط بوحدة تم بيعها (اختياري)
  title text,                                            -- عنوان العنصر في المعرض
  description text,
  price numeric,                                         -- اختياري (ليس مطلوباً في أعمال سابقة)
  images text[] not null default '{}',                   -- مصفوفة روابط الصور
  source text not null default 'manual',                 -- 'manual' | 'auto_sold'
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. الحجوزات العامة (يحجزها زوار الصفحة العامة)
create table if not exists public_reservations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  customer_name text not null,             -- اسم العميل الزائر
  phone text not null,                     -- رقم الهاتف (للتواصل)
  preferred_date date not null,            -- أقرب تاريخ متاح فيه
  period day_period not null,              -- الفترة: صباحي / بعد الظهر / مسائي
  note text,                               -- ملاحظات اختيارية (الميزانية، المتطلبات...)
  status public_reservation_status not null default 'new',
  claimed_by uuid references profiles(id) on delete set null,          -- من قام بالمتابعة
  claimed_customer_id uuid references customers(id) on delete set null, -- العميل المنشأ في CRM المتابع
  claimed_at timestamptz,
  created_at timestamptz default now()
);

-- منع تكرار نفس رقم الهاتف لنفس الوحدة والحجز ما زال جديداً (حماية من التكرار/السبام)
create unique index if not exists idx_public_reservations_dedup
  on public_reservations(company_id, unit_id, phone)
  where status = 'new';

-- 5. إنشاء صف الإعدادات تلقائياً عند إضافة شركة جديدة
create or replace function ensure_public_settings_row()
returns trigger language plpgsql security definer as $$
begin
  insert into company_public_settings (company_id) values (new.id)
  on conflict (company_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_ensure_public_settings on companies;
create trigger trg_ensure_public_settings
  after insert on companies
  for each row execute function ensure_public_settings_row();

-- 6. تفعيل الحماية على مستوى الصفوف
alter table company_public_settings enable row level security;
alter table company_gallery_items enable row level security;
alter table public_reservations enable row level security;

-- سياسات الإعدادات العامة
drop policy if exists "Company members view public settings" on company_public_settings;
create policy "Company members view public settings" on company_public_settings
  for select using (company_id = get_auth_company_id() or is_super_admin());

drop policy if exists "Company admin manage public settings" on company_public_settings;
create policy "Company admin manage public settings" on company_public_settings
  for all using (
    is_super_admin()
    or (is_company_admin() and company_id = get_auth_company_id())
  );

-- سياسات معرض أعمال سابقة
drop policy if exists "Company members view gallery" on company_gallery_items;
create policy "Company members view gallery" on company_gallery_items
  for select using (company_id = get_auth_company_id() or is_super_admin());

drop policy if exists "Company admin manage gallery" on company_gallery_items;
create policy "Company admin manage gallery" on company_gallery_items
  for all using (
    is_super_admin()
    or (is_company_admin() and company_id = get_auth_company_id())
  );

-- سياسات الحجوزات العامة (فريق الشركة كله يرى ويستلم المتابعة)
drop policy if exists "Company members view reservations" on public_reservations;
create policy "Company members view reservations" on public_reservations
  for select using (company_id = get_auth_company_id() or is_super_admin());

drop policy if exists "Company members claim reservations" on public_reservations;
create policy "Company members claim reservations" on public_reservations
  for update using (company_id = get_auth_company_id());

-- 7. الفهارس
create index if not exists idx_gallery_company on company_gallery_items(company_id, created_at desc);
create index if not exists idx_public_reservations_company on public_reservations(company_id, status, created_at desc);
create index if not exists idx_public_reservations_claimed on public_reservations(claimed_by);

-- 8. ملء الإعدادات للشركات الموجودة مسبقاً
insert into company_public_settings (company_id)
select id from companies
on conflict (company_id) do nothing;
