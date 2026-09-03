-- =====================================================================
-- MIGRASI: Kunci kasir per device (anti-rekayasa)
-- Jalankan di SQL Editor. Aman dijalankan di atas database yang sudah ada.
-- =====================================================================

-- 1) Tabel pendaftaran device: 1 device_id -> 1 karyawan, dikunci.
create table if not exists devices (
  id uuid primary key,                                    -- device_id, dibuat & disimpan di HP (localStorage)
  merchant_id uuid references merchants not null default get_my_merchant_id(),
  employee_id uuid references employees not null,
  created_at timestamptz default now()
);
alter table devices enable row level security;

drop policy if exists "merchant register device" on devices;
create policy "merchant register device" on devices
  for insert with check (merchant_id = get_my_merchant_id() and is_my_merchant_approved());

drop policy if exists "merchant read own devices" on devices;
create policy "merchant read own devices" on devices
  for select using (merchant_id = get_my_merchant_id());

-- SENGAJA tidak ada policy UPDATE/DELETE untuk user biasa -> user tidak
-- bisa ganti/hapus sendiri. Hanya admin (lihat policy di bawah) yang bisa.
drop policy if exists "admin manage devices" on devices;
create policy "admin manage devices" on devices
  for all using (is_admin()) with check (is_admin());

-- 2) Tandai transaksi ini datang dari device mana (opsional, nullable —
-- edit manual dari riwayat tetap tidak wajib set device_id).
alter table transactions add column if not exists device_id uuid references devices;

-- 3) INTI ANTI-REKAYASA: kalau device_id diisi saat insert, employee_id
-- SELALU ditimpa paksa oleh server sesuai pendaftaran device tsb —
-- apapun employee_id yang dikirim dari browser akan diabaikan.
-- Trigger ini hanya jalan saat INSERT baru (bukan saat edit/update),
-- jadi koreksi manual transaksi lama lewat halaman riwayat tetap bebas.
create or replace function enforce_transaction_employee()
returns trigger language plpgsql as $$
begin
  if new.device_id is not null then
    new.employee_id := (
      select employee_id from devices
      where id = new.device_id and merchant_id = new.merchant_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_transaction_employee on transactions;
create trigger trg_enforce_transaction_employee
before insert on transactions
for each row execute function enforce_transaction_employee();
