-- =====================================================================
-- FIX: device_id (localStorage) bisa "bentrok" antar merchant berbeda
-- kalau HP/browser yang sama pernah dipakai login ke akun lain (mis.
-- device testing yang dipakai gonta-ganti akun demo).
--
-- Sebelumnya primary key tabel devices cuma kolom `id` (device_id) —
-- jadi 1 device_id cuma bisa dimiliki 1 merchant SELAMANYA. Merchant lain
-- yang browsernya kebetulan punya device_id sama akan ditolak RLS saat
-- upsert ("new row violates row-level security policy (USING expression)").
--
-- Perbaikan: primary key digabung jadi (id, merchant_id), jadi 1 device_id
-- bisa terdaftar independen di tiap merchant tanpa saling tabrak.
--
-- Ada 2 tabel yang mereferensikan devices.id (transactions & attendance),
-- keduanya perlu dilepas dulu constraint-nya sebelum primary key diubah.
--
-- Aman dijalankan di atas database yang sudah ada. Jalankan sekali di
-- Supabase SQL Editor.
-- =====================================================================

alter table transactions drop constraint if exists transactions_device_id_fkey;
alter table attendance drop constraint if exists attendance_device_id_fkey;
alter table devices drop constraint if exists devices_pkey;
alter table devices add primary key (id, merchant_id);
