-- ==============================================================================
-- سكريبت ترحيل: إضافة أعمدة روابط التواصل وسابقة الأعمال + بيانات بيت الوطن (التجمع)
-- ==============================================================================

-- 1. إضافة عمود روابط التواصل الاجتماعي لجدول companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- 2. إضافة عمود التحكم في ظهور سابقة الأعمال لجدول company_public_settings
ALTER TABLE company_public_settings ADD COLUMN IF NOT EXISTS show_previous_work boolean NOT NULL DEFAULT true;

-- 3. إضافة عمود التبعية والمطور لجدول units
ALTER TABLE units ADD COLUMN IF NOT EXISTS belong_to text;

-- 4. ضمان وجود تسلسل تلقائي لـ id جدول buildings لتجنب أخطاء عدم التعيين مستقبلاً
CREATE SEQUENCE IF NOT EXISTS buildings_id_seq;
ALTER TABLE buildings ALTER COLUMN id SET DEFAULT nextval('buildings_id_seq');
SELECT setval('buildings_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM buildings), 0), 100) + 1, false);

-- 5. إدراج بيانات منطقة بيت الوطن بالتجمع وأحيائها الـ 10 وقطع 24، 47، 91 ووحداتها لشركة الواحة
DO $$
DECLARE
  v_company_id uuid;
  v_parent_zone_id bigint;
  v_zone_orchid_north bigint;
  v_zone_district_7 bigint;
  v_zone_district_8 bigint;
  v_next_bld_id bigint;
  v_bld_24 bigint;
  v_bld_47 bigint;
  v_bld_91 bigint;
BEGIN
  -- تحديد معرف شركة الواحة
  SELECT id INTO v_company_id 
  FROM companies 
  WHERE id = 'c0000000-0000-0000-0000-000000000001' 
     OR slug = 'elwaha' 
     OR name ILIKE '%elwaha%' 
     OR name ILIKE '%الواحة%'
  LIMIT 1;

  IF v_company_id IS NULL THEN
    SELECT id INTO v_company_id FROM companies ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF v_company_id IS NULL THEN
    RAISE NOTICE 'لم يتم العثور على شركة الواحة في قاعدة البيانات!';
    RETURN;
  END IF;

  -- 5.1 إدراج المنطقة الرئيسية: بيت الوطن (التجمع الخامس)
  SELECT id INTO v_parent_zone_id 
  FROM zones 
  WHERE company_id = v_company_id 
    AND parent_id IS NULL 
    AND (name ILIKE '%بيت الوطن%' OR name ILIKE '%التجمع%')
  LIMIT 1;

  IF v_parent_zone_id IS NULL THEN
    INSERT INTO zones (company_id, parent_id, name, direction, map_x, map_y, notes)
    VALUES (v_company_id, NULL, 'بيت الوطن (التجمع الخامس)', 'التجمع الخامس - القاهرة الجديدة', 50.0, 50.0, 'منطقة بيت الوطن بالتجمع الخامس وتشمل 8 أحياء رئيسية بالإضافة لمنطقتي الأوركيد وشمال الأوركيد')
    RETURNING id INTO v_parent_zone_id;
  END IF;

  -- 5.2 إدراج الأحياء والمناطق الفرعية الـ 10 تحت منطقة بيت الوطن
  -- الحي 1
  IF NOT EXISTS (SELECT 1 FROM zones WHERE company_id = v_company_id AND parent_id = v_parent_zone_id AND name = 'الحي الأول - بيت الوطن') THEN
    INSERT INTO zones (company_id, parent_id, name, direction, notes) VALUES (v_company_id, v_parent_zone_id, 'الحي الأول - بيت الوطن', 'شرقي', 'الحي الأول بالقرب من طريق السويس');
  END IF;

  -- الحي 2
  IF NOT EXISTS (SELECT 1 FROM zones WHERE company_id = v_company_id AND parent_id = v_parent_zone_id AND name = 'الحي الثاني - بيت الوطن') THEN
    INSERT INTO zones (company_id, parent_id, name, direction, notes) VALUES (v_company_id, v_parent_zone_id, 'الحي الثاني - بيت الوطن', 'بحري', 'الحي الثاني بالقرب من شارع التسعين الشمالي');
  END IF;

  -- الحي 3
  IF NOT EXISTS (SELECT 1 FROM zones WHERE company_id = v_company_id AND parent_id = v_parent_zone_id AND name = 'الحي الثالث - بيت الوطن') THEN
    INSERT INTO zones (company_id, parent_id, name, direction, notes) VALUES (v_company_id, v_parent_zone_id, 'الحي الثالث - بيت الوطن', 'بحري شرقي', 'الحي الثالث بيت الوطن');
  END IF;

  -- الحي 4
  IF NOT EXISTS (SELECT 1 FROM zones WHERE company_id = v_company_id AND parent_id = v_parent_zone_id AND name = 'الحي الرابع - بيت الوطن') THEN
    INSERT INTO zones (company_id, parent_id, name, direction, notes) VALUES (v_company_id, v_parent_zone_id, 'الحي الرابع - بيت الوطن', 'وسط', 'الحي الرابع بيت الوطن بالقرب من النوادي');
  END IF;

  -- الحي 5
  IF NOT EXISTS (SELECT 1 FROM zones WHERE company_id = v_company_id AND parent_id = v_parent_zone_id AND name = 'الحي الخامس - بيت الوطن') THEN
    INSERT INTO zones (company_id, parent_id, name, direction, notes) VALUES (v_company_id, v_parent_zone_id, 'الحي الخامس - بيت الوطن', 'قبلي', 'الحي الخامس بيت الوطن');
  END IF;

  -- الحي 6
  IF NOT EXISTS (SELECT 1 FROM zones WHERE company_id = v_company_id AND parent_id = v_parent_zone_id AND name = 'الحي السادس - بيت الوطن') THEN
    INSERT INTO zones (company_id, parent_id, name, direction, notes) VALUES (v_company_id, v_parent_zone_id, 'الحي السادس - بيت الوطن', 'قبلي شرقي', 'الحي السادس بيت الوطن على محور بن زايد');
  END IF;

  -- الحي 7
  SELECT id INTO v_zone_district_7 FROM zones WHERE company_id = v_company_id AND parent_id = v_parent_zone_id AND name = 'الحي السابع - بيت الوطن' LIMIT 1;
  IF v_zone_district_7 IS NULL THEN
    INSERT INTO zones (company_id, parent_id, name, direction, notes) 
    VALUES (v_company_id, v_parent_zone_id, 'الحي السابع - بيت الوطن', 'غربي', 'الحي السابع بيت الوطن بالقرب من النادي الأهلي ومحور محمد بن زايد')
    RETURNING id INTO v_zone_district_7;
  END IF;

  -- الحي 8
  SELECT id INTO v_zone_district_8 FROM zones WHERE company_id = v_company_id AND parent_id = v_parent_zone_id AND name = 'الحي الثامن - بيت الوطن' LIMIT 1;
  IF v_zone_district_8 IS NULL THEN
    INSERT INTO zones (company_id, parent_id, name, direction, notes) 
    VALUES (v_company_id, v_parent_zone_id, 'الحي الثامن - بيت الوطن', 'قبلي غربي', 'الحي الثامن بيت الوطن على محور بن زايد وبالقرب من العاصمة الإدارية')
    RETURNING id INTO v_zone_district_8;
  END IF;

  -- منطقة الأوركيد
  IF NOT EXISTS (SELECT 1 FROM zones WHERE company_id = v_company_id AND parent_id = v_parent_zone_id AND name = 'منطقة الأوركيد') THEN
    INSERT INTO zones (company_id, parent_id, name, direction, notes) VALUES (v_company_id, v_parent_zone_id, 'منطقة الأوركيد', 'شمالي', 'منطقة الأوركيد بالتجمع الخامس');
  END IF;

  -- منطقة شمال الأوركيد
  SELECT id INTO v_zone_orchid_north FROM zones WHERE company_id = v_company_id AND parent_id = v_parent_zone_id AND name = 'منطقة شمال الأوركيد' LIMIT 1;
  IF v_zone_orchid_north IS NULL THEN
    INSERT INTO zones (company_id, parent_id, name, direction, notes) 
    VALUES (v_company_id, v_parent_zone_id, 'منطقة شمال الأوركيد', 'شمالي', 'منطقة شمال الأوركيد بالتجمع الخامس بالقرب من طريق السويس')
    RETURNING id INTO v_zone_orchid_north;
  END IF;

  -- 5.3 إدراج المباني (قطع الأراضي 24، 47، 91) مع تحديد معرف المبنى id بدقة
  SELECT GREATEST(COALESCE(MAX(id), 0), 100) INTO v_next_bld_id FROM buildings;

  -- قطعة 24 - شمال الأوركيد
  SELECT id INTO v_bld_24 FROM buildings WHERE company_id = v_company_id AND zone_id = v_zone_orchid_north AND plot_no = 24 LIMIT 1;
  IF v_bld_24 IS NULL THEN
    v_next_bld_id := v_next_bld_id + 1;
    v_bld_24 := v_next_bld_id;
    INSERT INTO buildings (id, company_id, zone_id, plot_no, land_area, notes, features)
    VALUES (v_bld_24, v_company_id, v_zone_orchid_north, 24, 475, 'مبني 75% - استلام خلال سنة | الباركينج 150,000 | الروف كامل 7,200,000', '{}');
  END IF;

  -- قطعة 47 - الحي السابع
  SELECT id INTO v_bld_47 FROM buildings WHERE company_id = v_company_id AND zone_id = v_zone_district_7 AND plot_no = 47 LIMIT 1;
  IF v_bld_47 IS NULL THEN
    v_next_bld_id := v_next_bld_id + 1;
    v_bld_47 := v_next_bld_id;
    INSERT INTO buildings (id, company_id, zone_id, plot_no, land_area, notes, features)
    VALUES (v_bld_47, v_company_id, v_zone_district_7, 47, 935, 'استلام خلال سنتين | سعر المتر 24,500 | مقدم 1,000,000 وتقسيط حتى 5 سنوات', '{}');
  END IF;

  -- قطعة 91 - الحي الثامن
  SELECT id INTO v_bld_91 FROM buildings WHERE company_id = v_company_id AND zone_id = v_zone_district_8 AND plot_no = 91 LIMIT 1;
  IF v_bld_91 IS NULL THEN
    v_next_bld_id := v_next_bld_id + 1;
    v_bld_91 := v_next_bld_id;
    INSERT INTO buildings (id, company_id, zone_id, plot_no, land_area, notes, features)
    VALUES (v_bld_91, v_company_id, v_zone_district_8, 91, 660, 'الدور الأول 3 شقق (230 م لكل شقة) | سعر المتر 25,500 | مقدم 1,000,000 وتقسيط حتى 5 سنوات', '{}');
  END IF;

  -- 5.4 إدراج وحدات قطعة 24 (4 وحدات)
  IF NOT EXISTS (SELECT 1 FROM units WHERE company_id = v_company_id AND building_id = v_bld_24) THEN
    -- روف 1
    INSERT INTO units (id, company_id, building_id, unit_kind, floor, side, area, garden_area, price, negotiable, delivery_note, payment_terms, description, status, features, belong_to)
    VALUES (gen_random_uuid(), v_company_id, v_bld_24, 'roof', 4, 'واجهة', 135, 42, 3600000, false, 'خلال سنة', 'أساسي - حسب شروط المطور', 'شقة روف 1 - مساحة داخلية 135 م² + تراس 42 م² (إجمالي 177 م²) - مبني 75% - استلام خلال سنة', 'available', '{}', 'شركة الواحة للاستثمار العقاري');

    -- روف 2
    INSERT INTO units (id, company_id, building_id, unit_kind, floor, side, area, garden_area, price, negotiable, delivery_note, payment_terms, description, status, features, belong_to)
    VALUES (gen_random_uuid(), v_company_id, v_bld_24, 'roof', 4, 'واجهة', 135, 42, 3600000, false, 'خلال سنة', 'أساسي - حسب شروط المطور', 'شقة روف 2 - مساحة داخلية 135 م² + تراس 42 م² (إجمالي 177 م²) - مبني 75% - استلام خلال سنة', 'available', '{}', 'شركة الواحة للاستثمار العقاري');

    -- أرضي بجاردن (ريسيل)
    INSERT INTO units (id, company_id, building_id, unit_kind, floor, side, area, garden_area, price, negotiable, delivery_note, payment_terms, description, status, features, belong_to)
    VALUES (gen_random_uuid(), v_company_id, v_bld_24, 'ground_garden', 0, 'شمال الواجهة', 130, 100, 4500000, false, 'خلال سنة', 'مقدم 50% (2,250,000 ج.م) وتقسيط على سنتين ونصف (30 شهر) - قسط شهري 75,000 ج.م', 'شقة أرضي بجاردن (شمال الواجهة) - ريسيل - مساحة داخلية 130 م² + جاردن 100 م² (إجمالي 230 م²)', 'available', '{}', 'شركة الواحة للاستثمار العقاري');

    -- أول متكرر (ريسيل)
    INSERT INTO units (id, company_id, building_id, unit_kind, floor, side, area, garden_area, price, negotiable, delivery_note, payment_terms, description, status, features, belong_to)
    VALUES (gen_random_uuid(), v_company_id, v_bld_24, 'floor_1', 1, 'شمال الواجهة', 180, 0, 4500000, false, 'خلال سنة', 'مقدم 50% (2,250,000 ج.م) وتقسيط على سنتين ونصف (30 شهر) - قسط شهري 75,000 ج.م', 'شقة دور أول (شمال الواجهة) - ريسيل - مساحة 180 م²', 'available', '{}', 'شركة الواحة للاستثمار العقاري');
  END IF;

  -- 5.5 إدراج وحدات قطعة 47 (18 وحدة)
  IF NOT EXISTS (SELECT 1 FROM units WHERE company_id = v_company_id AND building_id = v_bld_47) THEN
    -- الدور الأرضي (3 شقق)
    INSERT INTO units (id, company_id, building_id, unit_kind, floor, side, area, garden_area, price, negotiable, delivery_note, payment_terms, description, status, features, belong_to) VALUES
    (gen_random_uuid(), v_company_id, v_bld_47, 'ground_garden', 0, 'شقة أرضي 1', 162, 172, 3969000, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 49,483 ج.م', 'شقة أرضي 1 بجاردن 172 م² - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري'),
    (gen_random_uuid(), v_company_id, v_bld_47, 'ground_garden', 0, 'شقة أرضي 2', 223, 90, 5463500, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 74,392 ج.م', 'شقة أرضي 2 بجاردن 90 م² - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري'),
    (gen_random_uuid(), v_company_id, v_bld_47, 'ground_garden', 0, 'شقة أرضي 3', 194, 102, 4753000, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 62,550 ج.م', 'شقة أرضي 3 بجاردن 102 م² - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري');

    -- الدور الأول (4 شقق)
    INSERT INTO units (id, company_id, building_id, unit_kind, floor, side, area, garden_area, price, negotiable, delivery_note, payment_terms, description, status, features, belong_to) VALUES
    (gen_random_uuid(), v_company_id, v_bld_47, 'floor_1', 1, 'شقة أ', 185, 0, 4532500, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 58,875 ج.م', 'شقة أ دور أول متكرر - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري'),
    (gen_random_uuid(), v_company_id, v_bld_47, 'floor_1', 1, 'شقة ب', 204, 0, 4998000, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 66,633 ج.م', 'شقة ب دور أول متكرر - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري'),
    (gen_random_uuid(), v_company_id, v_bld_47, 'floor_1', 1, 'شقة ج', 230, 0, 5635000, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 77,250 ج.م', 'شقة ج دور أول متكرر - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري'),
    (gen_random_uuid(), v_company_id, v_bld_47, 'floor_1', 1, 'شقة د', 171, 0, 4189500, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 53,158 ج.م', 'شقة د دور أول متكرر - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري');

    -- الدور الثاني (4 شقق)
    INSERT INTO units (id, company_id, building_id, unit_kind, floor, side, area, garden_area, price, negotiable, delivery_note, payment_terms, description, status, features, belong_to) VALUES
    (gen_random_uuid(), v_company_id, v_bld_47, 'floor_2', 2, 'شقة أ', 185, 0, 4532500, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 58,875 ج.م', 'شقة أ دور ثاني متكرر - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري'),
    (gen_random_uuid(), v_company_id, v_bld_47, 'floor_2', 2, 'شقة ب', 204, 0, 4998000, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 66,633 ج.م', 'شقة ب دور ثاني متكرر - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري'),
    (gen_random_uuid(), v_company_id, v_bld_47, 'floor_2', 2, 'شقة ج', 230, 0, 5635000, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 77,250 ج.م', 'شقة ج دور ثاني متكرر - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري'),
    (gen_random_uuid(), v_company_id, v_bld_47, 'floor_2', 2, 'شقة د', 171, 0, 4189500, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 53,158 ج.م', 'شقة د دور ثاني متكرر - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري');

    -- الدور الثالث (4 شقق)
    INSERT INTO units (id, company_id, building_id, unit_kind, floor, side, area, garden_area, price, negotiable, delivery_note, payment_terms, description, status, features, belong_to) VALUES
    (gen_random_uuid(), v_company_id, v_bld_47, 'floor_3', 3, 'شقة أ', 185, 0, 4532500, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 58,875 ج.م', 'شقة أ دور ثالث - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري'),
    (gen_random_uuid(), v_company_id, v_bld_47, 'floor_3', 3, 'شقة ب', 204, 0, 4998000, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 66,633 ج.م', 'شقة ب دور ثالث - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري'),
    (gen_random_uuid(), v_company_id, v_bld_47, 'floor_3', 3, 'شقة ج', 230, 0, 5635000, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 77,250 ج.م', 'شقة ج دور ثالث - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري'),
    (gen_random_uuid(), v_company_id, v_bld_47, 'floor_3', 3, 'شقة د', 171, 0, 4189500, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 53,158 ج.م', 'شقة د دور ثالث - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري');

    -- الروف (3 شقق)
    INSERT INTO units (id, company_id, building_id, unit_kind, floor, side, area, garden_area, price, negotiable, delivery_note, payment_terms, description, status, features, belong_to) VALUES
    (gen_random_uuid(), v_company_id, v_bld_47, 'roof', 4, 'شقة روف 1', 209, 60, 5120500, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 68,675 ج.م', 'شقة روف 1 بتراس 60 م² - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري'),
    (gen_random_uuid(), v_company_id, v_bld_47, 'roof', 4, 'شقة روف 2', 230, 53, 5635000, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 77,250 ج.م', 'شقة روف 2 بتراس 53 م² - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري'),
    (gen_random_uuid(), v_company_id, v_bld_47, 'roof', 4, 'شقة روف 3', 142, 42, 3479000, false, 'خلال سنتين', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 41,317 ج.م', 'شقة روف 3 بتراس 42 م² - الحي السابع بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري');
  END IF;

  -- 5.6 إدراج وحدات قطعة 91 (3 وحدات)
  IF NOT EXISTS (SELECT 1 FROM units WHERE company_id = v_company_id AND building_id = v_bld_91) THEN
    INSERT INTO units (id, company_id, building_id, unit_kind, floor, side, area, garden_area, price, negotiable, delivery_note, payment_terms, description, status, features, belong_to) VALUES
    (gen_random_uuid(), v_company_id, v_bld_91, 'floor_1', 1, 'شقة 1', 230, 0, 5865000, false, 'استلام حسب الاتفاق', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 81,083 ج.م', 'شقة 1 دور أول كامل - الحي الثامن بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري'),
    (gen_random_uuid(), v_company_id, v_bld_91, 'floor_1', 1, 'شقة 2', 230, 0, 5865000, false, 'استلام حسب الاتفاق', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 81,083 ج.م', 'شقة 2 دور أول كامل - الحي الثامن بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري'),
    (gen_random_uuid(), v_company_id, v_bld_91, 'floor_1', 1, 'شقة 3', 230, 0, 5865000, false, 'استلام حسب الاتفاق', 'مقدم 1,000,000 ج.م وتقسيط حتى 5 سنوات (60 شهراً) - قسط شهري 81,083 ج.م', 'شقة 3 دور أول كامل - الحي الثامن بيت الوطن', 'available', '{}', 'شركة الواحة للاستثمار العقاري');
  END IF;

  -- تحديث تسلسل جدول buildings ليتطابق مع آخر قيمة تم استخدامها
  PERFORM setval('buildings_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM buildings), 0), 100) + 1, false);

  RAISE NOTICE 'تم إدراج بيانات بيت الوطن وقطع الأراضي والوحدات الـ 25 بنجاح لشركة الواحة!';
END $$;
