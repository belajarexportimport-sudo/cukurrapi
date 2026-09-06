-- =====================================================================
-- MIGRASI: Absensi karyawan + foto bukti (tanpa AI/face-recognition)
-- Jalankan di SQL Editor. Aman dijalankan di atas database yang sudah ada.
-- =====================================================================

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants not null default get_my_merchant_id(),
  employee_id uuid references employees not null,
  device_id uuid references devices,
  check_in_at timestamptz not null default now(),
  check_in_photo text,
  check_out_at timestamptz,
  check_out_photo text,
  created_at timestamptz default now()
);
create index if not exists idx_attendance_merchant_date
  on attendance (merchant_id, check_in_at desc);

alter table attendance enable row level security;
drop policy if exists "merchant attendance" on attendance;
create policy "merchant attendance" on attendance
  for all using (merchant_id = get_my_merchant_id() and is_my_merchant_approved())
  with check (merchant_id = get_my_merchant_id() and is_my_merchant_approved());

-- Anti-rekayasa: sama seperti transaksi, employee_id absensi ditimpa paksa
-- sesuai pendaftaran device (bukan kiriman browser).
create or replace function enforce_attendance_employee()
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

drop trigger if exists trg_enforce_attendance_employee on attendance;
create trigger trg_enforce_attendance_employee
before insert on attendance
for each row execute function enforce_attendance_employee();

-- Storage bucket untuk foto absensi
insert into storage.buckets (id, name, public)
values ('attendance-photos', 'attendance-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read attendance photos" on storage.objects;
create policy "public read attendance photos" on storage.objects
  for select using (bucket_id = 'attendance-photos');

drop policy if exists "user upload attendance photos" on storage.objects;
create policy "user upload attendance photos" on storage.objects
  for insert with check (bucket_id = 'attendance-photos' and owner = auth.uid());
