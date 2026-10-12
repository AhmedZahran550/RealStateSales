-- =====================================================================
-- supabase/seed.sql  —  الحي المتميز (Badr City)
-- Run after migrations (supabase db reset runs it automatically).
-- DEVELOPMENT ONLY: contains known passwords. Never keep these
-- credentials on a production database — change them immediately.
-- Safe to re-run (idempotent).
--
-- Login: username -> email lookup is done by the app (profiles.username).
--   admin        / Admin@1234   (admin@hay-app.test)
--   AhmedZahran  / Test@1234    (ahmedzahran@hay-app.test)
-- =====================================================================

-- Schema addition required by this seed (skip if already in your migration)
alter table profiles add column if not exists username text;
create unique index if not exists profiles_username_key on profiles (lower(username));

-- ---------------------------------------------------------------------
-- 1) Auth users
-- ---------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
) values
('00000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000001','authenticated','authenticated',
 'admin@hay-app.test', crypt('Admin@1234', gen_salt('bf')), now(),
 '{"provider":"email","providers":["email"]}', '{"full_name":"Admin"}', now(), now(),
 '','','','','','','',''),
('00000000-0000-0000-0000-000000000000','a0000000-0000-0000-0000-000000000002','authenticated','authenticated',
 'ahmedzahran@hay-app.test', crypt('Test@1234', gen_salt('bf')), now(),
 '{"provider":"email","providers":["email"]}', '{"full_name":"Ahmed Zahran"}', now(), now(),
 '','','','','','','','')
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001',
 '{"sub":"a0000000-0000-0000-0000-000000000001","email":"admin@hay-app.test","email_verified":true}','email',now(),now(),now()),
(gen_random_uuid(),'a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000002',
 '{"sub":"a0000000-0000-0000-0000-000000000002","email":"ahmedzahran@hay-app.test","email_verified":true}','email',now(),now(),now())
on conflict do nothing;

insert into profiles (id, full_name, username, role) values
('a0000000-0000-0000-0000-000000000001','Admin','admin','admin'),
('a0000000-0000-0000-0000-000000000002','Ahmed Zahran','AhmedZahran','user')
on conflict (id) do update set full_name = excluded.full_name, username = excluded.username, role = excluded.role;

-- ---------------------------------------------------------------------
-- 2) Zones (map_x / map_y = fraction of the cropped master-map image, 0..1)
--    Zone 16 is not on the printed map: position left empty.
-- ---------------------------------------------------------------------
insert into zones (id, name, direction, map_x, map_y) values
  (1, 'منطقة 1', 'شرقي', 0.8942, 0.6847),
  (2, 'منطقة 2', 'شرقي', 0.8865, 0.4590),
  (3, 'منطقة 3', 'بحري شرقي', 0.7104, 0.2122),
  (4, 'منطقة 4', 'بحري', 0.4939, 0.1817),
  (5, 'منطقة 5', 'بحري غربي', 0.1793, 0.2759),
  (6, 'منطقة 6', 'غربي', 0.1099, 0.4407),
  (7, 'منطقة 7', 'غربي', 0.0862, 0.6969),
  (8, 'منطقة 8', 'قبلي شرقي', 0.7376, 0.6698),
  (9, 'منطقة 9', 'وسط - شرق المحور', 0.7195, 0.4529),
  (10, 'منطقة 10', 'وسط - شرق المحور', 0.5869, 0.4529),
  (11, 'منطقة 11', 'قبلي', 0.5824, 0.6427),
  (12, 'منطقة 12', 'قبلي', 0.4031, 0.6427),
  (13, 'منطقة 13', 'وسط - غرب المحور', 0.3995, 0.4529),
  (14, 'منطقة 14', 'وسط - غرب المحور', 0.2746, 0.4610),
  (15, 'منطقة 15', 'قبلي غربي', 0.2451, 0.6624),
  (16, 'منطقة 16', null, null, null)
on conflict (id) do update set name = excluded.name, direction = excluded.direction,
  map_x = excluded.map_x, map_y = excluded.map_y;

-- ---------------------------------------------------------------------
-- 3) Global services (admin-managed) and their zones
-- ---------------------------------------------------------------------
insert into services (name, category) values
('هايبر وان','mall'),
('مول العين','mall'),
('مول مصر','mall'),
('الداون تاون','mall'),
('الروبيكي','road'),
('طريق السويس','road'),
('الحزام الأخضر','green'),
('الحديقة المركزية','green'),
('مباشر على الجاردن','feature'),
('النادي الاجتماعي','club'),
('الجامعة الإيطالية','university'),
('Medical Point','medical'),
('العاصمة الإدارية الجديدة','area')
on conflict (name) do nothing;

insert into zone_services (zone_id, service_id)
select v.zone_id, s.id
from (values
  (1,'هايبر وان'),(1,'طريق السويس'),(1,'الروبيكي'),
  (2,'الروبيكي'),(2,'هايبر وان'),(2,'العاصمة الإدارية الجديدة'),
  (4,'الحديقة المركزية'),
  (5,'مول مصر'),(5,'Medical Point'),(5,'الجامعة الإيطالية'),
  (7,'مول مصر'),(7,'الداون تاون'),(7,'طريق السويس'),(7,'النادي الاجتماعي'),
  (8,'مول العين'),(8,'طريق السويس'),
  (11,'الحزام الأخضر'),(11,'مول العين'),(11,'طريق السويس')
) as v(zone_id, service_name)
join services s on s.name = v.service_name
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 4) Buildings (plots) that have data
-- ---------------------------------------------------------------------
insert into buildings (zone_id, plot_no, land_area) values
(1, 204, null),
(2,  42, null),
(7, 259, null),
(7, 314, null),
(8, 139, 500),
(11, 88, null)
on conflict (zone_id, plot_no) do nothing;

insert into building_services (building_id, service_id)
select b.id, s.id
from (values (7,259),(7,314),(8,139)) as v(zone_id, plot_no)
join buildings b on b.zone_id = v.zone_id and b.plot_no = v.plot_no
join services s on s.name = 'مباشر على الجاردن'
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 5) Units for the first user (AhmedZahran)
-- ---------------------------------------------------------------------
insert into units (id, owner_id, building_id, unit_kind, floor, side, area, garden_area, price,
                   negotiable, delivery_note, payment_terms, description, status)
select v.id::uuid, 'a0000000-0000-0000-0000-000000000002', b.id, v.unit_kind::unit_kind, v.floor, v.side,
       v.area, v.garden_area, v.price, v.negotiable, v.delivery_note, v.payment_terms, v.description,
       'available'::unit_status
from (values
 ('b0000000-0000-0000-0000-000000000001', 2, 42, 'floor_2', 2, 'شمال', 155::numeric, null::numeric, 1650000::numeric, false,
  null::text, null::text, 'تاني بلكونة شمال؛ على طريق الروبيكي مباشرة؛ قريبة من هايبر وان والعاصمة الإدارية الجديدة'),
 ('b0000000-0000-0000-0000-000000000002', 2, 42, 'duplex', null::int, 'يمين وشمال', 350, null, 1750000, false,
  null, null, 'دوبلكس (الدور الأرضي + البيزمنت + الجاردن)؛ متاح يمين وشمال في نفس القطعة'),
 ('b0000000-0000-0000-0000-000000000003', 11, 88, 'ground_garden', 0, 'شمال', 150, 100, 1750000, false,
  'تسليم فوري - متسلمة للجهاز', null, 'أرضي بجاردن شمال؛ تاني صف من طريق السويس بحري؛ مباشر على الحزام الأخضر؛ قريبة من مول العين (شغال)'),
 ('b0000000-0000-0000-0000-000000000004', 11, 88, 'floor_3', 3, 'شمال', 160, null, 1800000, false,
  'تسليم فوري - متسلمة للجهاز', null, 'دور تالت شمال؛ تاني صف من طريق السويس بحري؛ مباشر على الحزام الأخضر؛ قريبة من مول العين (شغال)'),
 ('b0000000-0000-0000-0000-000000000005', 7, 259, 'other', null, null, 140, null, 1650000, false,
  'تحت الإنشاء - استلام خلال سنة', 'مقدم 50% والباقي تسهيلات خلال سنة',
  'العمارة كلها متاحة، مساحات 140 م²؛ مباشر على الجاردن؛ قريبة من مول مصر والداون تاون وطريق السويس'),
 ('b0000000-0000-0000-0000-000000000006', 7, 314, 'other', null, null, 140, null, 1650000, false,
  'تحت الإنشاء - استلام خلال سنة', 'مقدم 50% والباقي تسهيلات خلال سنة',
  'العمارة كلها متاحة، مساحات 140 م²؛ نفس تفاصيل القطعة 259'),
 ('b0000000-0000-0000-0000-000000000007', 8, 139, 'duplex', null, null, 400, 100, 1950000, true,
  null, null, 'دوبلكس: 400 م² مباني على أرض 500 م²؛ الدور الأرضي 3 غرف و3 حمامات؛ مباشر على الجاردن؛ قريبة من مول العين وطريق السويس؛ فيه تفاوض بسيط'),
 ('b0000000-0000-0000-0000-000000000008', 1, 204, 'floor_1', 1, 'شمال', 140, null, 1650000, false,
  'تسليم خلال 6 شهور', null, 'دور أول شمال؛ قريبة من هايبر وان وطريق السويس والروبيكي')
) as v(id, zone_id, plot_no, unit_kind, floor, side, area, garden_area, price, negotiable, delivery_note, payment_terms, description)
join buildings b on b.zone_id = v.zone_id and b.plot_no = v.plot_no
on conflict (id) do nothing;
