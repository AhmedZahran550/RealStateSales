# Plan: Real-Estate Map + CRM App (Next.js + Supabase)

Project: الحي المتميز – مدينة بدر. Replaces the current static map page with a multi-user app.

---

## 1. Goals

1. **Admin** creates users (with password), changes passwords, renames and deletes users. No public sign-up.
2. Each **user** sees only his own units, either **marked on the map** or as **tables**, and can create, update and delete them.
3. Each unit can carry a **description with images and videos**.
4. Property structure: **منطقة (zone) 1–16 → مبنى (building, up to ~300 per zone) → وحدات (units)**.
5. **Services** (malls, hyper, club, roads…) are global reference data, managed by the admin and shown to every user on every building and unit.
6. A **customers (CRM) page** to track every customer: name, phone, interested units, stage, latest updates, notes, next follow-up.

---

## 2. Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router, TypeScript), Tailwind, shadcn/ui, RTL Arabic (Tajawal/Cairo font) |
| Backend | Supabase: Postgres, Auth, Storage, Row Level Security (RLS) |
| Sessions | `@supabase/ssr` (cookies, middleware) |
| Map | Master-map image in `/public`, pins by coordinates, `react-zoom-pan-pinch` for pan/zoom |
| Tables | TanStack Table (search, filter, sort, pagination) |
| Forms | react-hook-form + zod |
| Excel export | ExcelJS or SheetJS (server-side route) |
| Hosting | Vercel + Supabase project |

---

## 3. Data hierarchy

```
Zone (1..16)              global, seeded, admin-managed
 └─ Building (plot_no)    global, up to ~300 per zone; created on demand or imported
     └─ Unit              private to the user who owns it
         └─ Media         images / videos / links
```

- Plot numbers repeat across zones, so a building is unique by **(zone, plot_no)**.
- The printed master map shows **15** zones. Zone 16 is seeded but has no map position until you give me its location.
- A standard building layout: duplex (ground + basement + garden, usually 100 m² garden), floors 1–3, roof (built 25% or full). `unit_type` and `floor` reflect this, with a free-text `side` (شمال / يمين / شمال…).

---

## 4. Database schema

```sql
create type app_role      as enum ('admin','user');
create type unit_status   as enum ('available','reserved','sold');
create type unit_kind     as enum ('duplex','ground_garden','floor_1','floor_2','floor_3','roof','other');
create type media_kind    as enum ('image','video','link');
create type customer_stage as enum
  ('lead','asking','viewed','negotiating','reserved','closed','lost');
create type activity_type as enum ('call','whatsapp','visit','note','stage_change');

-- users
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  role app_role not null default 'user',
  created_at timestamptz default now()
);

-- global structure (admin-managed)
create table zones (
  id smallint primary key,            -- 1..16
  name text not null,
  direction text,                     -- بحري / قبلي / شرقي / غربي / وسط
  map_x numeric, map_y numeric,       -- pin position on the map image
  notes text
);

create table buildings (
  id bigint generated always as identity primary key,
  zone_id smallint not null references zones,
  plot_no int not null,
  land_area numeric,
  map_x numeric, map_y numeric,       -- optional, set by admin placement tool
  notes text,
  unique (zone_id, plot_no)
);

-- global services (admin-managed)
create table services (
  id bigint generated always as identity primary key,
  name text not null unique,          -- هايبر وان, مول العين, ...
  category text,                      -- mall, club, road, school, hospital...
  notes text
);
create table zone_services     (zone_id smallint references zones,    service_id bigint references services, primary key (zone_id, service_id));
create table building_services (building_id bigint references buildings, service_id bigint references services, primary key (building_id, service_id));

-- user-owned data
create table units (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles on delete cascade,
  building_id bigint not null references buildings,
  unit_kind unit_kind not null,
  floor smallint,
  side text,
  area numeric,                       -- built area m²
  garden_area numeric,
  price numeric,
  negotiable boolean default false,
  delivery_note text,                 -- تسليم فوري / خلال 6 شهور / تحت الإنشاء
  payment_terms text,                 -- مقدم 50% والباقي سنة
  description text,
  status unit_status default 'available',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table unit_media (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units on delete cascade,
  owner_id uuid not null references profiles on delete cascade,
  kind media_kind not null,
  storage_path text,                  -- for uploaded files
  external_url text,                  -- for YouTube / Drive links
  caption text,
  sort_order int default 0,
  size_bytes bigint,
  created_at timestamptz default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles on delete cascade,
  name text not null,
  phone text, whatsapp text,
  budget numeric,
  source text,                        -- إعلان, إحالة, زيارة...
  stage customer_stage not null default 'lead',
  next_followup_at timestamptz,
  notes text,
  deleted_at timestamptz,             -- soft delete
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table customer_units (
  customer_id uuid references customers on delete cascade,
  unit_id uuid references units on delete cascade,
  primary key (customer_id, unit_id)
);
create table customer_activities (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers on delete cascade,
  type activity_type not null,
  note text,
  created_at timestamptz default now()
);
```

Stage labels in the UI: عميل محتمل · بيسأل عن التفاصيل · نزل معاينة · تفاوض · حجز · تعاقد · خسرناه. Changing a stage inserts a `stage_change` activity automatically, so the customer keeps a history.

Indexes: `units(owner_id, building_id)`, `units(status)`, `customers(owner_id, stage)`, `customers(next_followup_at)`, `customer_activities(customer_id, created_at desc)`.

---

## 5. Security (RLS)

Enable RLS on **every** table. Helper: `is_admin()` = `exists (select 1 from profiles where id = auth.uid() and role = 'admin')` (SECURITY DEFINER).

| Table | Read | Write |
|---|---|---|
| `profiles` | own row | via server (service role) only |
| `zones`, `services`, `zone_services`, `building_services` | all signed-in users | admin |
| `buildings` | all signed-in users | users may **insert** (create if missing); update/delete admin only |
| `units`, `unit_media`, `customers` | `owner_id = auth.uid()` | `owner_id = auth.uid()` |
| `customer_units`, `customer_activities` | through the parent customer's owner | same |

Admin user management (create, change password, delete) runs only in **server actions** using the **service-role key**, after checking the caller is admin. Never expose that key in `NEXT_PUBLIC_*` variables.

- Create: `auth.admin.createUser({ email, password, email_confirm: true })` and insert the `profiles` row.
- Change password: `auth.admin.updateUserById(id, { password })`.
- Delete: `auth.admin.deleteUser(id)` (cascade removes that user's data unless reassigned first).
- First admin: create in the Supabase dashboard, then promote with one SQL update.

---

## 6. Images and videos (Supabase Storage)

- Private bucket `unit-media`. Path: `{owner_id}/{unit_id}/{uuid}.{ext}`.
- Storage policy: a user may read/insert/update/delete only objects whose first path folder equals `auth.uid()`.
- Display with **signed URLs** (short expiry), generated on the server.
- Upload from the browser directly to Storage (progress bar), then insert the `unit_media` row.
- Images: resize and convert to WebP on the client (max ~1600 px, ~300 KB) before upload. Create thumbnails for the grid.
- Videos: check your Supabase plan's per-file and total storage limits before relying on uploads (the free plan is small). Offer a **link option** (unlisted YouTube/Drive) as an alternative, stored as `kind = 'link'`.
- Deleting a unit or a media row also removes the file from Storage (server action).
- UI: gallery on the unit page, drag to reorder, caption per item, lightbox viewer.

---

## 7. Pages

**Auth**
- `/login`

**User area**
- `/map` — zoomable master map. Zone pins show the count of *my* units. Click a zone to zoom in and open a panel: the zone's services, its buildings (searchable by plot number, up to ~300), and my units in each. Buildings with a map position also appear as small markers.
- `/units` — table of my units with filters (zone, building, type, status, price range, service, has-media), sorting, Excel export, and **+ Add unit**.
- `/units/new`, `/units/[id]` — form with zone → building picker (type a plot number; creates the building if missing), all unit fields, description, media gallery, and services inherited from the building and zone.
- `/customers` — Kanban by stage (drag to move) and a table view. Filters: stage, follow-up due today/overdue, search by name or phone.
- `/customers/[id]` — details, interested units (linked), activity timeline, "add update" box (call / WhatsApp / visit / note + next follow-up date), WhatsApp click-to-chat link.
- `/dashboard` (optional) — counts per stage, today's follow-ups, units by status.

**Admin area**
- `/admin/users` — list, add (name, email, password), reset password, rename, delete.
- `/admin/services` — manage the service catalog and tick which zones/buildings each service belongs to.
- `/admin/zones` — edit zones, import buildings from CSV (`zone, plot_no, land_area`), place a building or zone on the map by clicking.

---

## 8. Reusing what exists

- Map image, zone pin coordinates, direction labels and the pan/zoom behavior come from the current prototype.
- Seed `services` and `zone_services` from the data we already collected (هايبر وان, مول العين, مول مصر, الداون تاون, الروبيكي, طريق السويس, الحزام الأخضر, الحديقة المركزية, النادي الاجتماعي, الجامعة الإيطالية, Medical Point).
- One-time seed script for the existing units (plots 42, 88, 139, 204, 259, 314) with the latest prices, assigned to a chosen user.

---

## 9. Build phases

| # | Phase | Output | Est. |
|---|---|---|---|
| 1 | Setup | Next.js + Supabase project, env vars, RTL layout, Vercel deploy | ½ day |
| 2 | Auth + admin users | `profiles`, middleware, login, `/admin/users` server actions | 1–2 days |
| 3 | Structure | zones/buildings/services schema, seed, `/admin/services`, `/admin/zones` + CSV import | 2 days |
| 4 | Units | schema + RLS, table page, CRUD forms, zone→building picker | 2 days |
| 5 | Media | Storage bucket + policies, upload, compression, gallery | 1–2 days |
| 6 | Map | live map with zone pins, drill-down, building markers, side panel | 2 days |
| 7 | Customers | schema + RLS, Kanban, details page, timeline, follow-ups | 2–3 days |
| 8 | Polish | Excel export, mobile layout, error/loading states, backups, tests of RLS | 1–2 days |

About 12–16 working days solo.

---

## 10. Practical rules

- Use the Supabase CLI migrations so the schema lives in git.
- Test RLS with two normal users and one admin: user A must never read user B's units, customers or media.
- Keep the service-role key server-only.
- Soft-delete customers (`deleted_at`) so a mistake is recoverable.
- Phone numbers are personal data: strict RLS, no logging.
- Turn on Supabase point-in-time or daily backups before real data goes in.
- Later: follow-up reminders by email/push, shared team view for managers.

---

## 11. Open questions

1. **Zone 16:** where is it on the map, and does the printed map simply omit it?
2. **Deleting a user:** delete his units and customers too, or reassign them to another user?
3. **Admin visibility:** should the admin be able to *see* all users' units and customers (read-only), or only manage accounts?
4. **Building list:** do you have the full list of plot numbers per zone (a sheet) to import, or should buildings be created as users add units?
5. **Video size:** typical clip length and number per unit, to decide upload vs. link-only.
