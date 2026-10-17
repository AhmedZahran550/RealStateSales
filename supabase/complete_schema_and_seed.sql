-- ==============================================================================
-- مشروع الواحة (El Waha) - سكريبت إنشاء الجداول والبيانات الأولية الشامل
-- Supabase PostgreSQL Schema & Initial Seed
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 0. تنظيف الجداول والأنواع القديمة لضمان عدم تعارض القيم
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS customer_activities CASCADE;
DROP TABLE IF EXISTS customer_units CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS unit_media CASCADE;
DROP TABLE IF EXISTS unit_history CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

DROP TYPE IF EXISTS app_role CASCADE;
DROP TYPE IF EXISTS unit_status CASCADE;
DROP TYPE IF EXISTS unit_kind CASCADE;
DROP TYPE IF EXISTS media_kind CASCADE;
DROP TYPE IF EXISTS customer_stage CASCADE;
DROP TYPE IF EXISTS activity_type CASCADE;

-- ------------------------------------------------------------------------------
-- 1. الأنواع والتصنيفات (Enums)
-- ------------------------------------------------------------------------------
CREATE TYPE app_role AS ENUM ('super_admin', 'company_admin', 'user', 'admin');
CREATE TYPE unit_status AS ENUM ('available', 'reserved', 'sold');
CREATE TYPE unit_kind AS ENUM ('duplex', 'ground_garden', 'floor_1', 'floor_2', 'floor_3', 'roof', 'other');
CREATE TYPE media_kind AS ENUM ('image', 'video', 'link');
CREATE TYPE customer_stage AS ENUM ('lead', 'asking', 'viewed', 'negotiating', 'reserved', 'closed', 'lost');
CREATE TYPE activity_type AS ENUM ('call', 'whatsapp', 'visit', 'note', 'stage_change');

-- ------------------------------------------------------------------------------
-- 2. الجداول الأساسية
-- ------------------------------------------------------------------------------

-- الشركات العقارية (Companies)
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  commercial_name text,
  logo_url text,
  phone text,
  email text,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- المستخدمون والملفات الشخصية (Profiles)
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  phone text UNIQUE,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- مناطق الحي المتميز (Zones 1..16)
CREATE TABLE zones (
  id smallint PRIMARY KEY,
  name text NOT NULL,
  direction text,
  map_x numeric,
  map_y numeric,
  notes text
);

-- المباني والقطع (Buildings)
CREATE TABLE buildings (
  id bigint PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  zone_id smallint NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  plot_no int NOT NULL,
  land_area numeric,
  features text[] DEFAULT '{}',
  map_x numeric,
  map_y numeric,
  notes text
);

-- الوحدات العقارية (Units)
CREATE TABLE units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  building_id bigint NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_kind unit_kind NOT NULL,
  floor smallint,
  side text,
  area numeric NOT NULL,
  garden_area numeric,
  price numeric NOT NULL,
  negotiable boolean DEFAULT false,
  delivery_note text,
  payment_terms text,
  description text,
  status unit_status DEFAULT 'available',
  features text[] DEFAULT '{}',
  lat numeric,
  lng numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- سجل تعديلات وحالات الوحدة (Unit History)
CREATE TABLE unit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  change_type text NOT NULL,
  old_status unit_status,
  new_status unit_status,
  details text,
  changes jsonb,
  created_at timestamptz DEFAULT now()
);

-- معرض وسائط الوحدات (Unit Media)
CREATE TABLE unit_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  kind media_kind NOT NULL DEFAULT 'image',
  storage_path text,
  external_url text,
  caption text,
  sort_order int DEFAULT 0,
  size_bytes bigint,
  created_at timestamptz DEFAULT now()
);

-- إدارة العملاء (CRM Customers)
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  budget numeric,
  source text,
  stage customer_stage NOT NULL DEFAULT 'lead',
  next_followup_at timestamptz,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ربط العملاء بالوحدات المهتمين بها (Customer Units)
CREATE TABLE customer_units (
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE,
  PRIMARY KEY (customer_id, unit_id)
);

-- سجل أنشطة ومتابعات العملاء (Customer Activities)
CREATE TABLE customer_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. صلاحيات الوصول الكامل للمنظومة (Permissions & Schema Access)
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. إدراج الشركة الأولى: Elwaha
-- ------------------------------------------------------------------------------
INSERT INTO companies (id, name, commercial_name, logo_url, phone, email, address, is_active)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Elwaha',
  'شركة الواحة للاستثمار العقاري',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80',
  '01000000001',
  'info@elwaha-realestate.com',
  'مدينة بدر - الحي المتميز - مول العين',
  true
);

-- ------------------------------------------------------------------------------
-- 5. إدراج المستخدمين الأساسيين (All passwords: !123456 hashed with bcrypt)
-- ------------------------------------------------------------------------------
-- 1. مدير المنصة العام (superadmin)
INSERT INTO profiles (id, company_id, full_name, username, password, phone, role)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  NULL,
  'مدير المنصة (Super Admin)',
  'superadmin',
  '$2b$10$RZoZL.CrhyBrC7OcNllntOGsVbk6I0TCHC1GnIWlOm2zRshZEvpoa',
  '01000000000',
  'super_admin'
);

-- 2. مدير شركة الواحة (admin)
INSERT INTO profiles (id, company_id, full_name, username, password, phone, role)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'مدير شركة الواحة (Admin)',
  'admin',
  '$2b$10$RZoZL.CrhyBrC7OcNllntOGsVbk6I0TCHC1GnIWlOm2zRshZEvpoa',
  '01011112222',
  'company_admin'
);

-- 3. الوسيط العقاري (ahmed)
INSERT INTO profiles (id, company_id, full_name, username, password, phone, role)
VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'أحمد زهران (Broker)',
  'ahmed',
  '$2b$10$RZoZL.CrhyBrC7OcNllntOGsVbk6I0TCHC1GnIWlOm2zRshZEvpoa',
  '01122334455',
  'user'
);

-- ------------------------------------------------------------------------------
-- 6. إدراج مناطق الحي المتميز (1..16)
-- ------------------------------------------------------------------------------
INSERT INTO zones (id, name, direction, map_x, map_y, notes) VALUES
  (1, 'منطقة 1', 'شرقي', 89.42, 68.47, 'هايبر وان، طريق السويس، الروبيكي'),
  (2, 'منطقة 2', 'شرقي', 87.50, 47.00, 'الروبيكي، هايبر وان، العاصمة الإدارية الجديدة'),
  (3, 'منطقة 3', 'بحري شرقي', 71.00, 25.50, NULL),
  (4, 'منطقة 4', 'بحري', 49.50, 22.50, 'الحديقة المركزية'),
  (5, 'منطقة 5', 'بحري غربي', 18.20, 31.50, 'مول مصر، Medical Point، الجامعة الإيطالية'),
  (6, 'منطقة 6', 'غربي', 11.00, 46.50, NULL),
  (7, 'منطقة 7', 'غربي', 9.00, 68.50, 'مول مصر، الداون تاون، طريق السويس، النادي الاجتماعي'),
  (8, 'منطقة 8', 'قبلي شرقي', 73.50, 66.00, 'مول العين، طريق السويس'),
  (9, 'منطقة 9', 'وسط - شرق المحور', 71.20, 48.00, NULL),
  (10, 'منطقة 10', 'وسط - شرق المحور', 58.80, 47.00, NULL),
  (11, 'منطقة 11', 'قبلي', 58.00, 64.00, 'الحزام الأخضر، مول العين، طريق السويس'),
  (12, 'منطقة 12', 'قبلي', 40.50, 64.00, NULL),
  (13, 'منطقة 13', 'وسط - غرب المحور', 40.00, 47.00, NULL),
  (14, 'منطقة 14', 'وسط - غرب المحور', 27.50, 48.00, NULL),
  (15, 'منطقة 15', 'قبلي غربي', 24.50, 66.00, NULL),
  (16, 'منطقة 16', 'امتداد قبلي', 50.00, 86.00, 'امتداد طريق السويس');

-- ------------------------------------------------------------------------------
-- 7. إدراج مباني وقطع شركة الواحة (Elwaha Buildings)
-- ------------------------------------------------------------------------------
INSERT INTO buildings (id, company_id, zone_id, plot_no, land_area, map_x, map_y, features, notes) VALUES
  (101, 'c0000000-0000-0000-0000-000000000001', 1, 204, 600, 89.5, 68.5, ARRAY['أسانسير إيطالي', 'مدخل رخام وجرانيت', 'جراج خاص', 'غاز طبيعي', 'واجهة كلاسيك'], 'قريبة من هايبر وان وطريق السويس والروبيكي'),
  (102, 'c0000000-0000-0000-0000-000000000001', 2, 42, 600, 88.7, 45.9, ARRAY['أسانسير مستورد', 'مدخل فندقي', 'واجهة الترا مودرن', 'حصة بالأرض'], 'على طريق الروبيكي مباشرة وقريبة من هايبر وان'),
  (103, 'c0000000-0000-0000-0000-000000000001', 7, 259, 550, 8.7, 69.7, ARRAY['مباشر على الجاردن', 'أسانسير', 'مدخل رخام', 'عدادات راكبة'], 'مباشر على الجاردن؛ قريبة من مول مصر والداون تاون'),
  (104, 'c0000000-0000-0000-0000-000000000001', 7, 314, 550, 8.8, 70.0, ARRAY['مباشر على الجاردن', 'أسانسير', 'مدخل رخام', 'عزل مائي وحراري'], 'مباشر على الجاردن؛ نفس تفاصيل القطعة 259'),
  (105, 'c0000000-0000-0000-0000-000000000001', 8, 139, 500, 73.8, 67.0, ARRAY['أرض 500 م²', 'مباشر على الجاردن', 'مدخل فخم', 'جراج خاص'], 'أرض 500 م²؛ مباشر على الجاردن ومول العين'),
  (106, 'c0000000-0000-0000-0000-000000000001', 11, 88, 620, 58.3, 64.3, ARRAY['تاني صف من طريق السويس', 'مباشر على الحزام الأخضر', 'أسانسير مرحلة أولى'], 'تاني صف من طريق السويس بحري؛ مباشر على الحزام الأخضر');

-- ------------------------------------------------------------------------------
-- 8. إدراج الوحدات العقارية لشركة الواحة (Elwaha Units)
-- ------------------------------------------------------------------------------
INSERT INTO units (
  id, company_id, building_id, unit_kind, floor, side, area, garden_area, price,
  negotiable, delivery_note, payment_terms, description, status, features, lat, lng
) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    102,
    'floor_2',
    2,
    'شمال',
    155,
    NULL,
    1650000,
    false,
    'استلام فوري',
    'كاش أو بتسهيلات سداد',
    'تاني بلكونة شمال؛ على طريق الروبيكي مباشرة؛ قريبة من هايبر وان والعاصمة الإدارية الجديدة',
    'available',
    ARRAY['تشطيب الترا سوبر لوكس', 'حصة بالأرض', 'عداد كهرباء ومياه راكب'],
    30.1432,
    31.7485
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    102,
    'duplex',
    0,
    'يمين وشمال',
    350,
    100,
    1750000,
    false,
    'استلام فوري',
    'كاش أو بتسهيلات سداد',
    'دوبلكس (الدور الأرضي + البيزمنت + الجاردن)؛ متاح يمين وشمال في نفس القطعة',
    'available',
    ARRAY[]::text[],
    30.1432,
    31.7485
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    106,
    'ground_garden',
    0,
    'شمال',
    150,
    100,
    1750000,
    false,
    'تسليم فوري - متسلمة للجهاز',
    'كاش أو بتسهيلات',
    'أرضي بجاردن شمال؛ تاني صف من طريق السويس بحري؛ مباشر على الحزام الأخضر؛ قريبة من مول العين (شغال)',
    'available',
    ARRAY['حديقة خاصة 100م²', 'مدخل مستقل', 'فيو مفتوح على الحزام الأخضر'],
    30.1325,
    31.7410
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    106,
    'floor_3',
    3,
    'شمال',
    160,
    NULL,
    1800000,
    false,
    'تسليم فوري - متسلمة للجهاز',
    'كاش',
    'دور تالت شمال؛ تاني صف من طريق السويس بحري؛ مباشر على الحزام الأخضر؛ قريبة من مول العين (شغال)',
    'available',
    ARRAY[]::text[],
    30.1325,
    31.7410
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000001',
    103,
    'other',
    NULL,
    NULL,
    140,
    NULL,
    1650000,
    false,
    'تحت الإنشاء - استلام خلال سنة',
    'مقدم 50% والباقي تسهيلات خلال سنة',
    'العمارة كلها متاحة، مساحات 140 م²؛ مباشر على الجاردن؛ قريبة من مول مصر والداون تاون وطريق السويس',
    'available',
    ARRAY['مقدم 50% مع تسهيلات', 'فيو مباشر على الجاردن'],
    30.1390,
    31.7320
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000001',
    104,
    'other',
    NULL,
    NULL,
    140,
    NULL,
    1650000,
    false,
    'تحت الإنشاء - استلام خلال سنة',
    'مقدم 50% والباقي تسهيلات خلال سنة',
    'العمارة كلها متاحة، مساحات 140 م²؛ نفس تفاصيل القطعة 259',
    'available',
    ARRAY[]::text[],
    30.1390,
    31.7320
  ),
  (
    'b0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000001',
    105,
    'duplex',
    NULL,
    NULL,
    400,
    100,
    1950000,
    true,
    'استلام فوري',
    'كاش مع تفاوض بسيط',
    'دوبلكس: 400 م² مباني على أرض 500 م²؛ الدور الأرضي 3 غرف و3 حمامات؛ مباشر على الجاردن؛ قريبة من مول العين وطريق السويس؛ فيه تفاوض بسيط',
    'available',
    ARRAY['مباشر على الجاردن', 'دوبلكس مساحة خاصة', 'حديقة 100م²'],
    30.1345,
    31.7450
  ),
  (
    'b0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000001',
    101,
    'floor_1',
    1,
    'شمال',
    140,
    NULL,
    1650000,
    false,
    'تسليم خلال 6 شهور',
    'مقدم بتسهيلات',
    'دور أول شمال؛ قريبة من هايبر وان وطريق السويس والروبيكي',
    'available',
    ARRAY['دور أول مميز', 'تسهيلات في السداد'],
    30.1460,
    31.7510
  );

-- ------------------------------------------------------------------------------
-- 9. إدراج صور وسائط الوحدات (Unit Media)
-- ------------------------------------------------------------------------------
INSERT INTO unit_media (id, unit_id, kind, external_url, caption) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'image', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', 'واجهة العمارة على محور الروبيكي مباشرة'),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'image', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80', 'مدخل الدوبلكس والحديقة الخاصة'),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'image', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', 'إطلالة الجاردن والحزام الأخضر بالمنطقة 11'),
  ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'image', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80', 'تراس مفتوح بفيو بحري غير مجروح'),
  ('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'image', 'https://images.unsplash.com/photo-16005851554526-990dced4db0d?auto=format&fit=crop&w=1200&q=80', 'موقع القطعة 259 بالمنطقة السابعة'),
  ('d0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', 'image', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80', 'موقع القطعة 314 بالمنطقة السابعة'),
  ('d0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000007', 'image', 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef5?auto=format&fit=crop&w=1200&q=80', 'حديقة وفيو الجاردن لدوبلكس قطعة 139'),
  ('d0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000008', 'image', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', 'القطعة 204 بالمنطقة الأولى');

COMMIT;
