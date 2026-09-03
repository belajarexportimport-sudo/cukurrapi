-- =====================================================================
-- BarberCatat — Supabase Setup (SQL)
-- Jalankan seluruh file ini di Supabase SQL Editor (satu kali, urutan atas ke bawah)
-- =====================================================================

-- ============ TABEL ============
create table if not exists merchants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users not null unique,
  name text not null,
  logo_url text,
  phone text,
  address text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============ HELPER: merchant milik user yang sedang login ============
-- security definer supaya bisa dipanggil dari dalam policy RLS tabel lain
-- tanpa terjebak rekursi RLS pada tabel merchants.
create or replace function get_my_merchant_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from merchants where owner_id = auth.uid() limit 1;
$$;

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants not null default get_my_merchant_id(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants not null default get_my_merchant_id(),
  name text not null,
  price numeric not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants not null default get_my_merchant_id(),
  employee_id uuid references employees not null,
  service_id uuid references services not null,
  price numeric not null check (price >= 0),
  transaction_date date not null default current_date,
  transaction_time time not null default current_time,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- index bantu query dashboard/riwayat per tanggal & merchant
create index if not exists idx_transactions_merchant_date
  on transactions (merchant_id, transaction_date desc, transaction_time desc);
create index if not exists idx_employees_merchant on employees (merchant_id);
create index if not exists idx_services_merchant on services (merchant_id);

-- ============ ADMIN (approval SaaS) ============
create table if not exists admins (
  user_id uuid primary key references auth.users,
  created_at timestamptz default now()
);
alter table admins enable row level security;

create or replace function is_admin()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists(select 1 from admins where user_id = auth.uid());
$$;

create or replace function is_my_merchant_approved()
returns boolean
language sql security definer set search_path = public stable
as $$
  select coalesce((select status = 'approved' from merchants where owner_id = auth.uid()), false);
$$;

-- ============ RLS ============
alter table merchants enable row level security;
alter table employees enable row level security;
alter table services enable row level security;
alter table transactions enable row level security;

create policy "self read admin" on admins
  for select using (user_id = auth.uid());

-- merchants: user hanya boleh baca/ubah merchant miliknya sendiri
create policy "own merchant" on merchants
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- admin boleh baca/ubah SEMUA merchant (untuk approve/reject)
create policy "admin manage merchants" on merchants
  for all using (is_admin()) with check (is_admin());

-- employees / services / transactions: dibatasi merchant_id milik user DAN merchant harus approved
create policy "merchant employees" on employees
  for all using (merchant_id = get_my_merchant_id() and is_my_merchant_approved())
  with check (merchant_id = get_my_merchant_id() and is_my_merchant_approved());

create policy "merchant services" on services
  for all using (merchant_id = get_my_merchant_id() and is_my_merchant_approved())
  with check (merchant_id = get_my_merchant_id() and is_my_merchant_approved());

create policy "merchant transactions" on transactions
  for all using (merchant_id = get_my_merchant_id() and is_my_merchant_approved())
  with check (merchant_id = get_my_merchant_id() and is_my_merchant_approved());

-- ============ TRIGGER updated_at ============
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_merchants_updated on merchants;
create trigger trg_merchants_updated before update on merchants
  for each row execute function set_updated_at();

drop trigger if exists trg_employees_updated on employees;
create trigger trg_employees_updated before update on employees
  for each row execute function set_updated_at();

drop trigger if exists trg_services_updated on services;
create trigger trg_services_updated before update on services
  for each row execute function set_updated_at();

drop trigger if exists trg_transactions_updated on transactions;
create trigger trg_transactions_updated before update on transactions
  for each row execute function set_updated_at();

-- ============ STORAGE (logo merchant) ============
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "public read logos" on storage.objects
  for select using (bucket_id = 'logos');

create policy "user upload logos" on storage.objects
  for insert with check (bucket_id = 'logos' and owner = auth.uid());

create policy "user update logos" on storage.objects
  for update using (bucket_id = 'logos' and owner = auth.uid())
  with check (bucket_id = 'logos' and owner = auth.uid());

create policy "user delete logos" on storage.objects
  for delete using (bucket_id = 'logos' and owner = auth.uid());
