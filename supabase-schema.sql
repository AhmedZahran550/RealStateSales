-- ==========================================================
-- مشروع الواحة (El Waha) - الحي المتميز بمدينة بدر
-- Supabase Postgres Schema & Row Level Security (RLS)
-- ==========================================================

-- 1. الأنواع والتصنيفات (Enums)
create type app_role as enum ('admin', 'user');
create type unit_status as enum ('available', 'reserved', 'sold');
create type unit_kind as enum ('duplex', 'ground_garden', 'floor_1', 'floor_2', 'floor_3', 'roof', 'other');
create type media_kind as enum ('image', 'video', 'link');
create type customer_stage as enum ('lead', 'asking', 'viewed', 'negotiating', 'reserved', 'closed', 'lost');
create type activity_type as enum ('call', 'whatsapp', 'visit', 'note', 'stage_change');

-- 2. جدول المستخدمين والوسطاء (باسم المستخدم وكلمة المرور والاسم بالكامل)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,        -- الاسم بالكامل
  username text not null unique,  -- اسم المستخدم
  phone text,                     -- رقم الهاتف المحمول
  role app_role not null default 'user',
  created_at timestamptz default now()
);

-- دالة التحقق من صلاحية مدير النظام
create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. جدول مناطق الحي المتميز (1..16)
create table zones (
  id smallint primary key, -- 1..16
  name text not null,
  direction text, -- بحري / قبلي / شرقي / غربي / وسط
  map_x numeric, -- إحداثيات الخريطة (0-100%)
  map_y numeric,
  notes text
);

-- 4. جدول المباني والقطع
create table buildings (
  id bigint generated always as identity primary key,
  zone_id smallint not null references zones(id) on delete cascade,
  plot_no int not null,
  land_area numeric,
  map_x numeric,
  map_y numeric,
  notes text,
  unique (zone_id, plot_no)
);

-- 5. دليل الخدمات والمولات
create table services (
  id bigint generated always as identity primary key,
  name text not null unique,
  category text, -- mall, club, road, school, hospital...
  notes text
);

create table zone_services (
  zone_id smallint references zones(id) on delete cascade,
  service_id bigint references services(id) on delete cascade,
  primary key (zone_id, service_id)
);

create table building_services (
  building_id bigint references buildings(id) on delete cascade,
  service_id bigint references services(id) on delete cascade,
  primary key (building_id, service_id)
);

-- 6. جدول الوحدات العقارية الخاصة بالوسيط
create table units (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  building_id bigint not null references buildings(id),
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. معرض صور وفيديوهات الوحدات
create table unit_media (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  kind media_kind not null,
  storage_path text,
  external_url text,
  caption text,
  sort_order int default 0,
  size_bytes bigint,
  created_at timestamptz default now()
);

-- 8. إدارة العملاء (CRM)
create table customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
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

create table customer_units (
  customer_id uuid references customers(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  primary key (customer_id, unit_id)
);

create table customer_activities (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  type activity_type not null,
  note text not null,
  created_at timestamptz default now()
);

-- 9. سياسات الأمان والحماية (RLS)
alter table profiles enable row level security;
alter table zones enable row level security;
alter table buildings enable row level security;
alter table services enable row level security;
alter table zone_services enable row level security;
alter table building_services enable row level security;
alter table units enable row level security;
alter table unit_media enable row level security;
alter table customers enable row level security;
alter table customer_units enable row level security;
alter table customer_activities enable row level security;

-- سياسات المستخدمين
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Admins can manage profiles" on profiles for all using (is_admin());

-- سياسات المناطق والخدمات
create policy "Authenticated users read zones" on zones for select to authenticated using (true);
create policy "Admin manage zones" on zones for all using (is_admin());

create policy "Authenticated users read buildings" on buildings for select to authenticated using (true);
create policy "Users can insert missing buildings" on buildings for insert to authenticated with check (true);
create policy "Admin update buildings" on buildings for update using (is_admin());
create policy "Admin delete buildings" on buildings for delete using (is_admin());

create policy "Authenticated read services" on services for select to authenticated using (true);
create policy "Admin manage services" on services for all using (is_admin());

create policy "Authenticated read zone_services" on zone_services for select to authenticated using (true);
create policy "Admin manage zone_services" on zone_services for all using (is_admin());

create policy "Authenticated read building_services" on building_services for select to authenticated using (true);
create policy "Admin manage building_services" on building_services for all using (is_admin());

-- سياسات الوحدات الخاصة بكل وسيط
create policy "Users manage own units" on units for all using (auth.uid() = owner_id or is_admin());
create policy "Users manage own media" on unit_media for all using (auth.uid() = owner_id or is_admin());

-- سياسات العملاء والمتابعات الخاصة بكل وسيط
create policy "Users manage own customers" on customers for all using (
  (auth.uid() = owner_id or is_admin()) and deleted_at is null
);
create policy "Users manage customer units" on customer_units for all using (
  exists (select 1 from customers c where c.id = customer_id and (c.owner_id = auth.uid() or is_admin()))
);
create policy "Users manage customer activities" on customer_activities for all using (
  exists (select 1 from customers c where c.id = customer_id and (c.owner_id = auth.uid() or is_admin()))
);

-- 10. فهارس السرعة والأداء
create index idx_units_owner on units(owner_id, building_id);
create index idx_units_status on units(status);
create index idx_customers_owner_stage on customers(owner_id, stage);
create index idx_customers_followup on customers(next_followup_at);
create index idx_customer_activities on customer_activities(customer_id, created_at desc);
