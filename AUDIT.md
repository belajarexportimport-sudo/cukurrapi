# Audit & Perbaikan — BarberCatat

Dokumen ini merangkum semua masalah yang ditemukan pada kode sebelumnya dan apa yang diperbaiki.

## Bug fatal (bikin aplikasi 100% tidak jalan)

1. **Supabase client tidak pernah dibuat.** `js/config.js` tidak punya
   `const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`,
   padahal semua halaman memanggil `db.auth...`, `db.from(...)`, dll.
   Akibatnya setiap halaman crash dengan `db is not defined` sejak baris
   pertama dijalankan (bahkan di `login.html`).
   → Diperbaiki: `db` sekarang dibuat sekali di `config.js` dan dipakai
   bersama di semua halaman.

2. **`js/employees.js` terpotong di tengah fungsi.** Ada teks
   `> ⚠️ The response reached the length limit. Reply **continue**...`
   tertanam langsung di dalam kode (bekas artefak copy-paste dari chat AI
   yang responsnya kepotong), membuat file gagal di-parse sama sekali
   (syntax error, semua fungsi setelahnya tidak pernah ter-load).

3. **`js/config.js` awalnya bukan kode, tapi dump markdown.** Isinya
   campuran teks penjelasan, blok kode ` ``` `, dan potongan file lain
   (login.html, signup.html, dashboard.html, dashboard.js, css) yang
   semuanya nyasar ke satu file `config.js`. File-file itu (login,
   signup, dashboard, css) akhirnya tidak pernah benar-benar ada sebagai
   file terpisah di project awal.

4. **Banyak template literal rusak** — kurung `${...}` hilang jadi
   `{...}` biasa, tanda kutip pintar Unicode (`′`, `⋅`) menggantikan
   kutip normal, sehingga banyak baris JS gagal di-parse atau
   menampilkan teks mentah seperti `x.id">{x.id}` di layar. Ditemukan di
   `employees.js`, `services.js`, `settings.js`, `transactions.js`,
   `dashboard.js`.

5. **Fungsi SQL `get_my_merchant_id()` rusak** — bukan sintaks SQL yang
   valid (ada karakter zero-width space yang menyusup, delimiter `$$`
   hilang). Ini fungsi kunci yang dipakai semua RLS policy, jadi seluruh
   setup Supabase akan gagal dijalankan.

## Bug fungsional (kode "kelihatan" jalan tapi salah/berisiko)

6. **`merchant_id` tidak pernah dikirim saat insert** karyawan/layanan/
   transaksi dari `employees.js`, `services.js`, `transactions.js`.
   Kolom itu `NOT NULL` tanpa default → insert akan selalu gagal dengan
   error constraint violation.
   → Diperbaiki dengan cara yang lebih aman: kolom `merchant_id` di
   tabel `employees`, `services`, `transactions` sekarang punya
   `default get_my_merchant_id()`, jadi otomatis terisi sesuai merchant
   milik user yang login — JS tidak perlu (dan tidak boleh) mengirim
   `merchant_id` secara manual.

7. **Halaman onboarding tidak pernah terhubung.** `js/onboarding.js`
   berisi wizard setup usaha, tapi `dashboard.html` tidak memuat
   script-nya sama sekali, dan `dashboard.js` tidak pernah memanggil
   `checkOnboarding()`. User baru (belum punya merchant) akan langsung
   error karena `dashboard.js` mengakses `merchant.logo_url` padahal
   `merchant` masih `null`.
   → Diperbaiki: `dashboard.html` memuat `onboarding.js` sebelum
   `dashboard.js`; `loadDashboard()` sekarang mengecek `merchant` dulu
   dan menampilkan wizard onboarding jika belum ada.

8. **Upload logo: nama file path rusak** (`` `user.id/logo.{user.id}/...` ``
   — bukan template literal valid) dan tidak ada policy `UPDATE` di
   Storage untuk kasus **upsert** logo yang sudah ada.
   → Diperbaiki: path jadi `` `${user.id}/logo.${ext}` `` dan
   ditambahkan policy update di `storage.objects`.

9. **Halaman selain dashboard tidak menjaga kondisi "belum onboarding".**
   Kalau user baru (merchant masih `null`) langsung buka
   `transactions.html`/`employees.html`/`services.html`, halaman akan
   crash. → Ditambahkan redirect otomatis ke `dashboard.html` di
   masing-masing.

10. **Tidak ada halaman `reset-password.html`** untuk menindaklanjuti
    email "lupa password" dari Supabase Auth — link di email tidak ada
    tujuannya. → Dibuat baru.

11. **Tidak ada `index.html`** sebagai entry point yang mengarahkan ke
    `dashboard.html` (jika sudah login) atau `login.html` (jika belum).
    → Dibuat baru.

## Perbaikan kualitas lain

- `$$` (helper `querySelectorAll`) sebelumnya didefinisikan tanpa nama
  variabel (`const = s => ...`) — syntax error. Sudah diperbaiki di
  semua tempat.
- Semua tombol submit sekarang di-`disable` sementara saat proses
  simpan berjalan, supaya tidak bisa double-submit dari HP yang koneksinya lambat.
- Ditambahkan `trigger updated_at` otomatis di database, jadi JS tidak
  perlu lagi mengirim `updated_at` manual di setiap update.
- Ditambahkan index database (`merchant_id, transaction_date`) supaya
  query dashboard & riwayat tetap cepat walau data sudah ribuan baris.
- Ditambahkan toast kecil ("✅ Transaksi tersimpan") untuk feedback
  instan setelah simpan — sesuai prinsip PRD "cepat, minim gesekan".
- Layout desktop (sidebar navigasi) sekarang konsisten di semua
  halaman, bukan cuma di dashboard.
- Wizard onboarding: tombol "Lewati" di tiap langkah sekarang benar-
  benar berfungsi (step 1 tetap membuat merchant dengan nama default
  agar user tidak terjebak; step 2 & 3 bisa dilewati tanpa membuat
  layanan/karyawan dummy).

## Yang perlu kamu lakukan sebelum deploy

1. Buka **Supabase → SQL Editor**, jalankan ulang seluruh isi
   `sql/Supabase Setup (SQL).sql` dari awal (di project baru/kosong —
   kalau project lama sudah terlanjur dijalankan dengan fungsi yang
   rusak, sebaiknya buat project baru atau hapus manual
   tabel/fungsi/policy lama dulu).
2. Ganti `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `js/config.js`
   dengan punya project kamu (Project Settings → API).
3. Di **Supabase → Authentication → URL Configuration**, tambahkan
   domain Cloudflare Pages kamu ke *Redirect URLs* (untuk email
   verifikasi & reset password).
4. Deploy folder ini ke Cloudflare Pages (root langsung berisi
   `index.html`, tidak perlu build step — HTML/CSS/JS vanilla sesuai PRD).
