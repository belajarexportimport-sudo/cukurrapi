-- =====================================================================
-- FITUR: Trial 14 hari otomatis untuk merchant baru.
--
-- Merchant baru sign up -> status tetap 'pending' (approval manual admin
-- tetap ada & bisa dipercepat kapan saja), TAPI selama trial_ends_at belum
-- lewat, dianggap aktif penuh sama seperti 'approved'. Begitu lewat dan
-- belum di-approve, otomatis terkunci lagi (lihat perubahan di dashboard.js
-- & halaman lain).
--
-- Aman dijalankan di atas database yang sudah ada. Jalankan sekali di
-- Supabase SQL Editor.
-- =====================================================================

-- Merchant lama yang belum punya kolom ini akan dapat trial 14 hari
-- terhitung SAAT MIGRASI INI DIJALANKAN (bukan dari created_at lama mereka).
-- Merchant baru setelah ini otomatis dapat 14 hari dari saat mereka sign up.
alter table merchants
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '14 days');

-- Ganti definisi fungsi ini (dipakai di semua RLS policy employees/
-- services/transactions/attendance/devices) supaya juga menganggap
-- merchant aktif kalau masih dalam masa trial, bukan cuma status approved.
create or replace function is_my_merchant_approved()
returns boolean
language sql security definer set search_path = public stable
as $$
  select coalesce(
    (select status = 'approved' or (status = 'pending' and trial_ends_at > now())
     from merchants where owner_id = auth.uid()),
    false
  );
$$;
