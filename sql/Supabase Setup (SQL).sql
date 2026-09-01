-- ============ TABEL ============
create table merchants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users not null unique,
  name text not null,
  logo_url text,
  phone text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants not null,
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants not null,
  name text not null,
  price numeric not null check (price >= 0),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants not null,
  employee_id uuid references employees not null,
  service_id uuid references services not null,
  price numeric not null check (price >= 0),
  transaction_date date not null default current_date,
  transaction_time time not null default current_time,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============ HELPER: merchant milik user ============
create or replace function get_my_merchant_id()
returns uuid language sql security definer stable as selectidfrommerchantswhereownerid=auth.uid();select id from merchants where owner_id = auth.uid();selectidfrommerchantswhereowneri​d=auth.uid();;

-- ============ RLS ============
alter table merchants enable row level security;
alter table employees enable row level security;
alter table services enable row level security;
alter table transactions enable row level security;

-- merchants
create policy "own merchant" on merchants
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- employees / services / transactions (pola sama)
create policy "merchant employees" on employees
  for all using (merchant_id = get_my_merchant_id())
  with check (merchant_id = get_my_merchant_id());

create policy "merchant services" on services
  for all using (merchant_id = get_my_merchant_id())
  with check (merchant_id = get_my_merchant_id());

create policy "merchant transactions" on transactions
  for all using (merchant_id = get_my_merchant_id())
  with check (merchant_id = get_my_merchant_id());

-- ============ STORAGE (logo merchant) ============
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true);

create policy "public read logos" on storage.objects
  for select using (bucket_id = 'logos');

create policy "user upload logos" on storage.objects
  for insert with check (bucket_id = 'logos' and owner = auth.uid());

create policy "user delete logos" on storage.objects
  for delete using (bucket_id = 'logos' and owner = auth.uid());
