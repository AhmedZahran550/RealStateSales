-- ==========================================================
-- مشروع الواحة (El Waha) - التطبيق متعدد الشركات (Multi-Tenant Architecture)
-- Supabase Postgres Schema & Row Level Security (RLS)
-- الأدوار: مدير المنصة (super_admin) | مدير الشركة (company_admin) | الوسيط العقاري (user)
-- ==========================================================

-- 1. الأنواع والتصنيفات (Enums)
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('super_admin', 'company_admin', 'user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE unit_status AS ENUM ('available', 'reserved', 'sold');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE unit_kind AS ENUM ('duplex', 'ground_garden', 'floor_1', 'floor_2', 'floor_3', 'roof', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE media_kind AS ENUM ('image', 'video', 'link');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE customer_stage AS ENUM ('lead', 'asking', 'viewed', 'negotiating', 'reserved', 'closed', 'lost');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM ('call', 'whatsapp', 'visit', 'note', 'stage_change');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. جدول الشركات العقارية (Companies / Tenants)
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,                  -- اسم الشركة
  commercial_name text,                -- السجل التجاري أو الاسم التجاري
  logo_url text,                       -- رابط شعار الشركة
  phone text,                          -- هاتف التواصل
  email text,                          -- البريد الإلكتروني للشركة
  address text,                        -- المقر الرئيسي
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. جدول المستخدمين والملفات الشخصية (Profiles)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  company_id uuid references companies(id) on delete cascade, -- null لمدير المنصة Super Admin
  full_name text not null,        -- الاسم بالكامل
  username text not null unique,  -- اسم المستخدم
  password text,                  -- كلمة المرور المحفوظة للتسجيل السريع
  phone text,                     -- رقم الهاتف المحمول (فريد لكل مستخدم)
  role app_role not null default 'user',
  created_at timestamptz default now()
);

-- دوال الصلاحيات والأمان (Helper Security Definer Functions)
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

-- 4. جدول مناطق الحي المتميز (1..16)
create table if not exists zones (
  id smallint primary key, -- 1..16
  name text not null,
  direction text, -- بحري / قبلي / شرقي / غربي / وسط
  map_x numeric, -- إحداثيات الخريطة (0-100%)
  map_y numeric,
  notes text
);

-- 5. جدول المباني والقطع (تابعة لكل شركة مع مميزات المبنى)
create table if not exists buildings (
  id bigint generated always as identity primary key,
  company_id uuid references companies(id) on delete cascade,
  zone_id smallint not null references zones(id) on delete cascade,
  plot_no int not null,
  land_area numeric,
  features text[] default '{}', -- مميزات المبنى (أسانسير، مدخل رخام، واجهة فاخرة، جراج...)
  map_x numeric,
  map_y numeric,
  notes text
);

-- 6. جدول الوحدات العقارية (المسؤول عنها الشركة ومملوكة للشركة حصراً)
create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade, -- الوحدة ملك للشركة فقط
  building_id bigint not null references buildings(id) on delete cascade,
  unit_kind unit_kind not null,
  floor smallint,
  side text,
  area numeric not null,
  garden_area numeric,
  price numeric not null,
  negotiable boolean default false,
  delivery_note text,
  payment_terms text,
  description text,
  status unit_status default 'available',
  features text[] default '{}', -- مميزات خاصة بالوحدة (ترث من المبنى إذا كانت فارغة)
  lat numeric,
  lng numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. جدول سجل تغييرات وحالات الوحدة (Unit History & Audit Log)
create table if not exists unit_history (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  changed_by uuid references profiles(id) on delete set null, -- المستخدم الذي أجرى التعديل
  change_type text not null, -- 'status_change', 'price_change', 'details_update', 'created'
  old_status unit_status,
  new_status unit_status,
  details text, -- ملخص التغيير بالعربية
  changes jsonb, -- تفاصيل الحقول المعدلة إن وجدت
  created_at timestamptz default now()
);

-- 8. معرض صور وفيديوهات الوحدات
create table if not exists unit_media (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  owner_id uuid references profiles(id) on delete set null,
  kind media_kind not null,
  storage_path text,
  external_url text,
  caption text,
  sort_order int default 0,
  size_bytes bigint,
  created_at timestamptz default now()
);

-- 9. إدارة العملاء والمتابعات الخاصة بكل وسيط (CRM - ملك للوسيط فقط 100%)
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade, -- الوسيط صاحب العميل حصراً
  name text not null,
  phone text not null,
  whatsapp text,
  budget numeric,
  source text,
  stage customer_stage not null default 'lead',
  next_followup_at timestamptz,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists customer_units (
  customer_id uuid references customers(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  primary key (customer_id, unit_id)
);

create table if not exists customer_activities (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  type activity_type not null,
  note text not null,
  created_at timestamptz default now()
);

-- 10. تفعيل الحماية والأمان على مستوى الصفوف (Row Level Security - RLS)
alter table companies enable row level security;
alter table profiles enable row level security;
alter table zones enable row level security;
alter table buildings enable row level security;
alter table units enable row level security;
alter table unit_history enable row level security;
alter table unit_media enable row level security;
alter table customers enable row level security;
alter table customer_units enable row level security;
alter table customer_activities enable row level security;

-- ==========================================================
-- سياسات الشركات (Companies)
-- ==========================================================
create policy "Super admin manages companies" on companies
  for all using (is_super_admin());

create policy "Users can view their own company" on companies
  for select using (id = get_auth_company_id() or is_super_admin());

-- ==========================================================
-- سياسات المستخدمين (Profiles)
-- ==========================================================
create policy "Users can view members of their company" on profiles
  for select using (
    id = auth.uid() 
    or (company_id is not null and company_id = get_auth_company_id()) 
    or is_super_admin()
  );

create policy "Company admin manages company users" on profiles
  for all using (
    is_super_admin() 
    or (is_company_admin() and company_id = get_auth_company_id())
  );

-- ==========================================================
-- سياسات المباني والوحدات العقارية (Buildings & Units)
-- ==========================================================
-- المباني:
create policy "Company members view buildings" on buildings
  for select using (
    company_id is null 
    or company_id = get_auth_company_id() 
    or is_super_admin()
  );

create policy "Company admin manages buildings" on buildings
  for all using (
    is_super_admin() 
    or (is_company_admin() and (company_id is null or company_id = get_auth_company_id()))
  );

-- الوحدات العقارية (مملوكة للشركة):
-- 1. القراءة: جميع أعضاء الشركة (المدير والوسطاء) يمكنهم استعراض كل وحدات شركتهم
create policy "Company members view company units" on units
  for select using (
    company_id = get_auth_company_id() 
    or is_super_admin()
  );

-- 2. الإضافة والحذف والتعديل الشامل: لمدير الشركة ومدير المنصة
create policy "Company admin manage units" on units
  for all using (
    is_super_admin() 
    or (is_company_admin() and company_id = get_auth_company_id())
  );

-- 3. الوسطاء: تعديل حالة الوحدة فقط (متاح / محجوز / مباع)
create policy "Brokers update unit status" on units
  for update using (
    company_id = get_auth_company_id()
  )
  with check (
    company_id = get_auth_company_id()
  );

-- ==========================================================
-- سياسات سجل تعديلات الوحدات (Unit History)
-- ==========================================================
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

-- سياسات وسائط الوحدات (Media)
create policy "Company members view unit media" on unit_media
  for select using (true);

create policy "Company admin manage unit media" on unit_media
  for all using (
    is_super_admin() or is_company_admin()
  );

-- ==========================================================
-- سياسات العملاء والمتابعات (CRM - عزل صارم 100% للوسيط فقط)
-- ==========================================================
-- لا يرى العميل ولا يديره إلا الوسيط صاحب الحساب فقط (الحسابات غير مرتبطة بالشركات)
create policy "Brokers strictly manage their own customers" on customers
  for all using (
    owner_id = auth.uid()
  )
  with check (
    owner_id = auth.uid()
  );

create policy "Brokers strictly manage their customer units" on customer_units
  for all using (
    exists (select 1 from customers c where c.id = customer_id and c.owner_id = auth.uid())
  );

create policy "Brokers strictly manage their customer activities" on customer_activities
  for all using (
    exists (select 1 from customers c where c.id = customer_id and c.owner_id = auth.uid())
  );

-- سياسات المناطق (عامة لجميع المشتركين)
create policy "Authenticated users read zones" on zones for select to authenticated using (true);
create policy "Super admin manage zones" on zones for all using (is_super_admin());

-- 11. الفهارس لتسريع الاستعلامات والأداء العالي
create index if not exists idx_profiles_company on profiles(company_id, role);
create index if not exists idx_units_company on units(company_id, status);
create index if not exists idx_units_building on units(building_id);
create index if not exists idx_unit_history_unit on unit_history(unit_id, created_at desc);
create index if not exists idx_customers_owner on customers(owner_id, stage);
create index if not exists idx_customers_followup on customers(next_followup_at);
create index if not exists idx_customer_activities on customer_activities(customer_id, created_at desc);
