-- =====================================================================
-- MIGRASI: Sistem approval user (SaaS) — jalankan di SQL Editor.
-- Aman dijalankan di atas database yang sudah ada (tidak menghapus data).
-- =====================================================================

-- 1) Kolom status approval di merchants
alter table merchants
  add column if not exists status text not null default 'pending'
  check (status in ('pending', 'approved', 'rejected'));

-- 2) Tabel admin — daftar user_id yang boleh approve/reject
create table if not exists admins (
  user_id uuid primary key references auth.users,
  created_at timestamptz default now()
);
alter table admins enable row level security;

drop policy if exists "self read admin" on admins;
create policy "self read admin" on admins
  for select using (user_id = auth.uid());

-- 3) Helper: apakah user saat ini admin?
create or replace function is_admin()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists(select 1 from admins where user_id = auth.uid());
$$;

-- 4) Helper: apakah merchant milik user saat ini sudah approved?
create or replace function is_my_merchant_approved()
returns boolean
language sql security definer set search_path = public stable
as $$
  select coalesce((select status = 'approved' from merchants where owner_id = auth.uid()), false);
$$;

-- 5) Admin boleh baca & ubah SEMUA baris merchants (untuk approve/reject)
drop policy if exists "admin manage merchants" on merchants;
create policy "admin manage merchants" on merchants
  for all using (is_admin()) with check (is_admin());

-- 6) Kunci employees/services/transactions: hanya boleh diakses kalau merchant-nya sudah approved
drop policy if exists "merchant employees" on employees;
create policy "merchant employees" on employees
  for all using (merchant_id = get_my_merchant_id() and is_my_merchant_approved())
  with check (merchant_id = get_my_merchant_id() and is_my_merchant_approved());

drop policy if exists "merchant services" on services;
create policy "merchant services" on services
  for all using (merchant_id = get_my_merchant_id() and is_my_merchant_approved())
  with check (merchant_id = get_my_merchant_id() and is_my_merchant_approved());

drop policy if exists "merchant transactions" on transactions;
create policy "merchant transactions" on transactions
  for all using (merchant_id = get_my_merchant_id() and is_my_merchant_approved())
  with check (merchant_id = get_my_merchant_id() and is_my_merchant_approved());

-- =====================================================================
-- 7) WAJIB: jadikan akun kamu sendiri sebagai admin pertama.
-- Ganti email di bawah dengan email akun kamu, lalu jalankan baris ini:
-- =====================================================================
-- insert into admins (user_id)
-- select id from auth.users where email = 'email_kamu@contoh.com'
-- on conflict (user_id) do nothing;

-- 8) (Opsional) approve akun-akun yang sudah terlanjur ada sebelum fitur ini,
-- supaya tidak mendadak semua user existing ke-lock. Uncomment kalau perlu:
-- update merchants set status = 'approved' where status = 'pending';
