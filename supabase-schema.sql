-- Enable handy extension for no-overlap constraints
create extension if not exists btree_gist;

-- 1) Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz default now()
);

-- 2) Businesses
create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  timezone text not null default 'America/Puerto_Rico',
  messaging_mode text not null default 'manual',  -- manual | wa_cloud | twilio
  location text,
  created_at timestamptz default now()
);

-- 3) Staff
create table staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  display_name text not null,
  phone text,
  role text not null default 'member', -- member | admin
  created_at timestamptz default now()
);

-- 4) Services
create table services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text,
  duration_min integer not null check (duration_min between 5 and 600),
  price_cents integer not null default 0,
  deposit_cents integer not null default 0,
  buffer_before_min integer not null default 0,
  buffer_after_min integer not null default 0,
  max_per_slot smallint not null default 1,
  created_at timestamptz default now()
);

-- 5) Junction: which staff can perform which services
create table service_staff (
  service_id uuid references services(id) on delete cascade,
  staff_id uuid references staff(id) on delete cascade,
  primary key (service_id, staff_id)
);

-- 6) Weekly availability (per staff OR business-wide if staff_id null)
create table availability_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  staff_id uuid references staff(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0=Sun
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);

-- 7) Exceptions / blackout or special windows
create table availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  staff_id uuid references staff(id) on delete cascade,
  date date not null,
  is_closed boolean not null default true,
  start_time time,
  end_time time,
  created_at timestamptz default now()
);

-- 8) Appointments
create type appointment_status as enum ('pending','confirmed','canceled','noshow','completed');

create table appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  service_id uuid not null references services(id) on delete restrict,
  staff_id uuid references staff(id) on delete set null,
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  customer_name text not null,
  customer_phone text not null,
  customer_locale text default 'es-PR',
  status appointment_status not null default 'confirmed',
  source text not null default 'public', -- public | admin
  notes text,
  deposit_payment_id uuid,
  created_at timestamptz default now(),
  -- prevent overlaps per staff (NULL staff means business-level resource)
  exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
);

-- 9) Payments (Stripe/ATH)
create type payment_status as enum ('pending','succeeded','failed','refunded');
create type payment_type as enum ('deposit','service','no_show_fee');

create table payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  provider text not null, -- 'stripe' | 'ath'
  external_id text,       -- stripe session id or ATH reference
  amount_cents integer not null,
  currency char(3) not null default 'USD',
  status payment_status not null default 'pending',
  kind payment_type not null default 'deposit',
  created_at timestamptz default now(),
  meta jsonb default '{}'::jsonb
);

-- 10) Messages log (WhatsApp/SMS)
create table messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete cascade,
  to_phone text not null,
  channel text not null, -- whatsapp | sms
  direction text not null default 'out', -- out | in
  status text not null default 'queued', -- queued | sent | delivered | failed
  template_key text,
  body text not null,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Helper: am I a member of this business?
create or replace function is_business_member(bid uuid)
returns boolean language sql stable as $
  select exists (
    select 1
    from businesses b
    where b.id = bid
      and (b.owner_id = auth.uid()
        or exists (select 1 from staff s where s.business_id = bid and s.user_id = auth.uid()))
  );
$;

-- Helper: get user's business (bypassing RLS for debugging)
create or replace function get_user_business(user_id uuid)
returns table(id uuid, name text, slug text, timezone text, location text, messaging_mode text)
language sql security definer as $
  select b.id, b.name, b.slug, b.timezone, b.location, b.messaging_mode
  from businesses b
  where b.owner_id = user_id
  limit 1;
$;

-- RLS
alter table profiles enable row level security;
alter table businesses enable row level security;
alter table staff enable row level security;
alter table services enable row level security;
alter table service_staff enable row level security;
alter table availability_rules enable row level security;
alter table availability_exceptions enable row level security;
alter table appointments enable row level security;
alter table payments enable row level security;
alter table messages enable row level security;

-- Policies
create policy "own profile" on profiles
  for select using (id = auth.uid());
create policy "own profile update" on profiles
  for update using (id = auth.uid());

create policy "owners/staff can read business" on businesses
  for select using (is_business_member(id));
create policy "only owner insert business" on businesses
  for insert with check (owner_id = auth.uid());
create policy "owner can update business" on businesses
  for update using (owner_id = auth.uid());

create policy "members read staff" on staff
  for select using (is_business_member(business_id));
create policy "members mutate staff" on staff
  for insert with check (is_business_member(business_id));
create policy "members update staff" on staff
  for update using (is_business_member(business_id));
create policy "members delete staff" on staff
  for delete using (is_business_member(business_id));

create policy "members read services" on services
  for select using (is_business_member(business_id));
create policy "members mutate services" on services
  for all using (is_business_member(business_id)) with check (is_business_member(business_id));

create policy "members read service_staff" on service_staff
  for select using (exists (select 1 from services s where s.id = service_id and is_business_member(s.business_id)));
create policy "members mutate service_staff" on service_staff
  for all using (exists (select 1 from services s where s.id = service_id and is_business_member(s.business_id)))
  with check (exists (select 1 from services s where s.id = service_id and is_business_member(s.business_id)));

create policy "members read availability_rules" on availability_rules
  for select using (is_business_member(business_id));
create policy "members mutate availability_rules" on availability_rules
  for all using (is_business_member(business_id)) with check (is_business_member(business_id));

create policy "members read availability_exceptions" on availability_exceptions
  for select using (is_business_member(business_id));
create policy "members mutate availability_exceptions" on availability_exceptions
  for all using (is_business_member(business_id)) with check (is_business_member(business_id));

create policy "members read appointments" on appointments
  for select using (is_business_member(business_id));

-- Allow public booking (anon) inserts ONLY for future times
create policy "public can create pending appointments"
  on appointments
  for insert
  to anon
  with check (starts_at > now());

-- Only members can update/cancel
create policy "members update appointments"
  on appointments for update using (is_business_member(business_id));

create policy "members read payments" on payments 
  for select using (is_business_member(business_id));
create policy "members insert payments" on payments 
  for insert with check (is_business_member(business_id));

create policy "members read messages" on messages 
  for select using (is_business_member(business_id));
create policy "members insert messages" on messages 
  for insert with check (is_business_member(business_id));