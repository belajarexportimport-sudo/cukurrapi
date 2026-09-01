# **PRD — Aplikasi Pencatatan Jasa Pangkas Rambut** 

### **SaaS Multi-Merchant · Mobile First · Simple & Fast** 

**Versi:** 1.0 

**Tanggal:** 1 September 2026 

## **1. Gambaran Produk** 

Aplikasi SaaS sederhana untuk membantu usaha pangkas rambut/barbershop mencatat transaksi harian dan memantau pendapatan berdasarkan karyawan/pemangkas rambut. 

Aplikasi dirancang agar dapat digunakan oleh **banyak merchant/user yang berbeda** , dengan data masing-masing merchant terisolasi. 

Setiap merchant dapat: 

- Membuat akun sendiri 

- Mengatur nama usaha 

- Mengatur logo usaha 

- Menambahkan karyawan/pemangkas rambut 

- Menambahkan daftar harga/paket layanan 

- Mencatat transaksi 

- Melihat omzet harian 

- Melihat jumlah customer 

- Melihat performa setiap pemangkas rambut 

### **Prinsip utama** 

**Buka aplikasi → pilih pemangkas → pilih layanan → simpan. Selesai.** 

Tidak dibuat seperti software kasir besar yang penuh fitur. 

# **2. Target Pengguna** 

### **Primary User** 

Pemilik: 

- Barbershop 

- Pangkas rambut 

- Salon pria 

1 

- Barber rumahan 

- Usaha jasa grooming sederhana 

### **Secondary User** 

Karyawan/pemangkas rambut yang membantu mencatat transaksi. 

# **3. Teknologi** 

Aplikasi menggunakan: 

### **Frontend** 

- HTML 

- CSS 

- JavaScript Vanilla 

- Mobile-first 

- Responsive desktop/mobile 

#### **Tidak menggunakan React/Vue/Angular.** 

### **Backend & Database** 

- Supabase 

- Supabase Authentication 

- PostgreSQL 

- Row Level Security (RLS) 

### **Hosting** 

- Cloudflare Pages 

### **Repository** 

- GitHub 

### **Arsitektur** 

```
User
  ↓
Cloudflare Pages
  ↓
HTML / CSS / JavaScript
  ↓
Supabase Auth
```

2 

```
  ↓
Supabase PostgreSQL
```

# **4. Konsep SaaS** 

Aplikasi harus mendukung banyak merchant. 

Contoh: 

```
Merchant A
├── Karyawan
├── Paket Harga
├── Transaksi
└── Dashboard
Merchant B
├── Karyawan
├── Paket Harga
├── Transaksi
└── Dashboard
```

#### Data Merchant A **tidak boleh terlihat oleh Merchant B** . 

Setiap data harus memiliki hubungan dengan <mark>`merchant_id` .</mark> 

RLS Supabase wajib digunakan untuk memastikan user hanya dapat membaca dan mengubah data milik merchant-nya. 

# **5. Authentication** 

Menggunakan: 

#### **Supabase Authentication** 

Fitur MVP: 

• Sign Up • Login • Logout • Email verification • Forgot password 

3 

• Reset password 

Setelah login, user masuk ke merchant miliknya. 

### **Konsep akun** 

Satu akun dapat memiliki satu merchant pada MVP. 

Contoh: 

```
User
  ↓
Merchant
  ↓
Karyawan
  ↓
Transaksi
```

# **6. Branding Merchant** 

Setiap merchant dapat mengatur identitas usaha. 

Menu: 

## **Pengaturan Merchant** 

Field: 

- Nama usaha • Logo 

- Nomor WhatsApp • Alamat 

- Status aktif 

Contoh: 

```
[ LOGO ]
BARBER JAYA
Pangkas Rambut & Grooming
```

4 

Logo dan nama merchant ditampilkan pada: 

- Header aplikasi 

- Dashboard 

- Halaman transaksi 

- Tampilan mobile 

### **Logo** 

Merchant dapat: 

- Upload logo 

- Mengganti logo 

- Menghapus logo 

Logo dapat disimpan menggunakan **Supabase Storage** . 

Jika ingin MVP benar-benar ringan, logo cukup dibatasi: 

- JPG • PNG 

- WebP • Maksimum ukuran file misalnya 1–2 MB 

# **7. Struktur Menu** 

Menu utama dibuat sangat sederhana. 

### **Mobile** 

Bottom navigation: 



<!-- Start of picture text -->
┌─────────────────────────────┐<br>│                             │<br>│        CONTENT              │<br>│                             │<br>├─────────────────────────────┤<br>│ Dashboard │ Transaksi │ ⚙  │<br>└─────────────────────────────┘<br><!-- End of picture text -->

Menu utama: 

1. **Dashboard** 

2. **Transaksi** 

5 

#### 3. **Master Data / Pengaturan** 

Master Data berisi: 

• Harga Paket • Karyawan • Pengaturan Merchant 

# **8. Dashboard** 

Dashboard merupakan halaman utama setelah login. 

Tujuannya agar pemilik usaha bisa langsung mengetahui kondisi usaha hari ini. 

## **Dashboard Hari Ini** 

Bagian atas: 

```
Selamat datang
BARBER JAYA
01 September 2026
```

### **Statistik utama** 

```
Revenue Hari Ini
Rp 750.000
Customer Hari Ini
25
Transaksi
25
```

# **9. Revenue Harian Per Karyawan** 

Dashboard menampilkan performa setiap pemangkas. 

Contoh: 

6 

```
Revenue Hari Ini
Andi
Rp 300.000
10 customer
Budi
Rp 250.000
8 customer
Candra
Rp 200.000
7 customer
```

Bisa menggunakan card sederhana. 

# **10. Customer Per Karyawan** 

Dashboard juga menampilkan jumlah customer berdasarkan pemangkas. 

Contoh: 

|Pemangkas|Customer|Revenue|
|---|---|---|
|Andi|10|Rp300.000|
|Budi|8|Rp250.000|
|Candra|7|Rp200.000|



Urutan default: 

**Revenue terbesar → terkecil** 

# **11. Filter Dashboard** 

Dashboard memiliki filter tanggal. 

MVP: 

- Hari ini • Kemarin 

7 

- 7 hari terakhir • Bulan ini • Custom tanggal 

Contoh: 

```
Tanggal
[ Hari ini ▼ ]
Revenue
Rp 750.000
Customer
25
```

Untuk versi berikutnya dapat ditambahkan grafik. 

# **12. Transaksi** 

Ini adalah fitur terpenting aplikasi. 

Tujuan: 

Mencatat satu customer yang selesai melakukan jasa pangkas. 

Tampilan harus dibuat **secepat mungkin** . 

# **13. Form Tambah Transaksi** 

Contoh: 

```
Tambah Transaksi
Pemangkas
[ Andi ▼ ]
Layanan
[ Potong Rambut ▼ ]
Harga
```

8 

```
Rp 30.000
Tanggal
01/09/2026
Jam
14:35
[ SIMPAN TRANSAKSI ]
```

Tanggal dan jam otomatis menggunakan waktu saat transaksi dibuat. 

User tetap dapat mengubah tanggal/jam jika diperlukan. 

# **14. Pemilihan Layanan** 

Layanan diambil dari menu Harga Paket. 

Contoh: 

```
Pilih Layanan
Potong Rambut
Rp 30.000
Potong + Cuci
Rp 45.000
Potong + Cuci + Styling
Rp 60.000
```

Ketika layanan dipilih: 

**Harga otomatis terisi.** 

# **15. Harga Paket** 

Menu: 

9 

## **Harga Paket** 

Merchant dapat membuat daftar layanan. 

Contoh: 

```
Potong Rambut
Rp 30.000
Aktif
Potong + Cuci
Rp 45.000
Aktif
Potong + Styling
Rp 50.000
Aktif
```

Fitur: 

- Tambah layanan 

- Edit layanan 

- Nonaktifkan layanan 

- Aktifkan kembali 

- Hapus layanan jika belum digunakan 

### **Field** 

```
Nama layanan
Harga
Status
```

# **16. Karyawan / Pemangkas Rambut** 

Menu: 

## **Karyawan** 

Contoh: 

10 

```
Andi
Aktif
Budi
Aktif
Candra
Aktif
```

Fitur: 

- Tambah karyawan 

- Edit nama 

- Aktif/nonaktif 

- Hapus jika belum memiliki transaksi 

Field MVP: 

```
Nama karyawan
Status
```

Tidak perlu membuat sistem payroll pada MVP. 

# **17. Riwayat Transaksi** 

Menu transaksi juga dapat menampilkan riwayat. 

Contoh: 

```
01 September 2026
```

```
14:35
Andi
Potong Rambut
Rp30.000
14:21
Budi
Potong + Cuci
Rp45.000
13:55
```

11 

```
Andi
Potong Rambut
Rp30.000
```

Filter: 

- Tanggal 

- Pemangkas 

- Layanan 

Search dapat ditambahkan pada tahap berikutnya. 

# **18. Detail Transaksi** 

Ketika transaksi diklik: 

```
Detail Transaksi
```

```
Tanggal
01 September 2026
Jam
14:35
Pemangkas
Andi
Layanan
Potong Rambut
```

```
Harga
Rp30.000
```

MVP: 

- View detail 

- Edit transaksi 

- Hapus transaksi 

# **19. Customer** 

Untuk MVP **tidak perlu membuat database customer yang kompleks** . 

12 

Setiap transaksi cukup dihitung sebagai: 

#### **1 customer / 1 transaksi** 

Sehingga: 

```
Customer Hari Ini
=
Jumlah transaksi hari ini
```

Ini membuat aplikasi jauh lebih sederhana dan cepat. 

### **Future** 

Jika diperlukan nanti dapat ditambahkan: 

- Nama customer 

- Nomor WhatsApp 

- Riwayat customer 

- Customer langganan 

- Total spending customer 

Tetapi **jangan masuk MVP** . 

# **20. Revenue** 

Revenue dihitung dari transaksi. 

Formula: 

```
Revenue
=
SUM(harga transaksi)
```

Contoh: 

```
Andi
10 transaksi × Rp30.000
= Rp300.000
```

Dashboard menggunakan data transaksi yang tersimpan di Supabase. 

13 

# **21. Database** 

Struktur database MVP yang disarankan: 

## **merchants** 

```
id
owner_id
name
logo_url
phone
address
created_at
updated_at
```

## **employees** 

```
id
merchant_id
name
is_active
created_at
updated_at
```

## **services** 

```
id
merchant_id
name
price
is_active
created_at
updated_at
```

14 

## **transactions** 

```
id
merchant_id
employee_id
service_id
price
transaction_date
transaction_time
created_at
updated_at
```

# **22. Relasi Database** 

```
auth.users
     │
     │ owner_id
     ↓
 merchants
     │
     ├───────────────┐
     ↓               ↓
 employees        services
     │               │
     └───────┬───────┘
             ↓
       transactions
```

Semua data bisnis memiliki: 

```
merchant_id
```

Ini penting untuk keamanan SaaS. 

# **23. RLS Supabase** 

RLS wajib aktif. 

Contoh konsep: 

15 

```
User A
   ↓
Merchant A
   ↓
Data Merchant A
```

User A tidak boleh: 

```
SELECT data Merchant B
INSERT transaksi Merchant B
UPDATE employee Merchant B
DELETE service Merchant B
```

Semua query harus dibatasi berdasarkan merchant milik user yang login. 

# **24. Keamanan** 

MVP wajib: 

- Supabase Auth • Email verification 

- RLS 

- Tidak menyimpan password sendiri 

- Tidak menggunakan service-role key di frontend 

- Supabase anon/publishable key boleh digunakan di frontend 

- Validasi input 

- Validasi harga 

- Validasi merchant ownership 

#### **Service Role Key tidak boleh dimasukkan ke HTML/JavaScript frontend.** 

# **25. Mobile First** 

Prioritas utama adalah smartphone. 

Target penggunaan: 

```
360px
375px
```

16 

```
390px
412px
```

Contoh penggunaan: 

Pemangkas selesai memotong rambut → mengambil HP → membuka aplikasi → input transaksi → selesai dalam beberapa detik. 

# **26. Prinsip UI/UX** 

Desain: 

- Simple 

- Bersih 

- Cepat 

- Tidak banyak animasi 

- Tombol cukup besar 

- Form pendek 

- Minim popup 

- Minim halaman 

- Tidak banyak tabel pada mobile 

### **Hindari** 

- Sidebar kompleks • Dashboard penuh grafik 

- Animasi berlebihan 

- Form panjang 

- Banyak field wajib 

- Fitur accounting kompleks 

# **27. Quick Transaction** 

Salah satu target UX utama: 

#### **Transaksi dapat dicatat maksimal 3 langkah.** 

Contoh: 

`1. Pilih Pemangkas` 

- `↓` 

`2. Pilih Layanan` 

17 

```
       ↓
```

`3. Simpan` 

Tanggal dan jam otomatis. 

Harga otomatis. 

Sehingga user tidak perlu mengetik banyak. 

# **28. Empty State** 

Jika merchant baru pertama kali menggunakan aplikasi: 

Dashboard: 

```
Belum ada transaksi hari ini.
Yuk catat transaksi pertama.
```

Button: 

```
+ Tambah Transaksi
```

Jika belum ada karyawan: 

```
Belum ada karyawan.
Tambah pemangkas rambut terlebih dahulu.
```

Jika belum ada layanan: 

```
Belum ada harga layanan.
```

```
Tambahkan layanan pertama.
```

18 

# **29. Onboarding Merchant** 

Setelah signup pertama: 

### **Step 1** 

```
Nama usaha Anda?
[ Barber Jaya ]
```

### **Step 2** 

```
Tambahkan layanan pertama
Nama:
Potong Rambut
Harga:
30000
```

### **Step 3** 

```
Tambahkan pemangkas
Nama:
Andi
```

### **Step 4** 

```
Selesai!
Anda siap mencatat transaksi.
```

Onboarding harus dapat dilewati dan dilanjutkan nanti. 

# **30. Pengaturan Merchant** 

Menu: 

19 

```
Pengaturan
Profil Usaha
├── Logo
├── Nama Usaha
├── Nomor WhatsApp
└── Alamat
```

```
Data
├── Harga Paket
└── Karyawan
Akun
├── Email
├── Ubah Password
└── Logout
```

# **31. Responsive Desktop** 

Walaupun mobile-first, desktop tetap didukung. 

Desktop dapat menggunakan: 

|`┌──────────────┬───────────────────────────────┐`<br>`│              │                               │`|
|---|
|<br>`│ Dashboard    │ Dashboard                     │`|
|`│ Transaksi    │                               │`|
|`│ Harga        │ Revenue                       │`|
|`│ Karyawan     │ Customer                      │`|
|`│ Pengaturan   │                               │`|
|`│              │ Performa Karyawan             │`|
|`│              │                               │`<br>`└──────────────┴───────────────────────────────┘`|



# **32. Dashboard Desktop** 

Desktop dapat menampilkan: 

20 

```
Revenue Hari Ini
Rp 1.250.000
Customer
42
Transaksi
42
```

Kemudian: 

```
Performa Karyawan
```

```
Andi       15 customer    Rp450.000
Budi       14 customer    Rp400.000
Candra     13 customer    Rp400.000
```

# **33. Performance** 

Karena aplikasi hanya menggunakan HTML/CSS/JS: 

Target: 

- Fast initial load • JavaScript minimal 

- Tidak menggunakan framework besar 

- Tidak menggunakan library yang tidak diperlukan • Query Supabase efisien • Mobile-friendly 

Target pengalaman: 

Buka aplikasi → dashboard muncul cepat → transaksi dapat langsung dibuat. 

# **34. Struktur Folder** 

Struktur awal: 

```
barber-saas/
│
```

21 

```
├── index.html
├── login.html
├── signup.html
├── dashboard.html
├── transactions.html
├── employees.html
├── services.html
├── settings.html
│
├── css/
│   ├── style.css
│   ├── auth.css
│   └── responsive.css
│
├── js/
│   ├── config.js
│   ├── auth.js
│   ├── supabase.js
│   ├── dashboard.js
│   ├── transactions.js
│   ├── employees.js
│   ├── services.js
│   └── settings.js
│
└── assets/
    ├── logo/
    └── icons/
```

Struktur ini masih bisa disederhanakan lagi jika diperlukan. 

# **35. MVP Scope** 

### **WAJIB ADA** 

#### **Authentication** 

- [x] Sign Up • [x] Login • [x] Logout • [x] Email verification • [x] Forgot password 

#### **Merchant** 

- [x] Nama usaha 

22 

- [x] Logo • [x] Profil usaha 

#### **Karyawan** 

- [x] Tambah • [x] Edit • [x] Aktif/nonaktif 

#### **Harga** 

- [x] Tambah layanan • [x] Edit layanan • [x] Harga • [x] Aktif/nonaktif 

#### **Transaksi** 

• [x] Pilih karyawan • [x] Pilih layanan • [x] Harga otomatis • [x] Tanggal • [x] Jam • [x] Simpan transaksi • [x] Edit transaksi • [x] Hapus transaksi 

#### **Dashboard** 

- [x] Revenue harian • [x] Customer harian • [x] Transaksi harian • [x] Revenue per karyawan • [x] Customer per karyawan • [x] Filter tanggal 

# **36. Jangan Masukkan ke MVP** 

Agar aplikasi tetap simple, fitur berikut ditunda: 

- Inventory • Pembelian barang • Payroll • Komisi karyawan • Akuntansi 

- Hutang/piutang 

23 

- QRIS integration 

- Payment gateway 

- Booking online 

- Membership 

- Loyalty point 

- Customer database kompleks 

- WhatsApp automation 

- Multi-cabang 

- Printer 

- Hardware POS 

- Offline mode 

- Advanced analytics 

Semua dapat menjadi **future feature** jika produk sudah digunakan banyak merchant. 

# **37. Roadmap** 

## **Phase 1 — MVP** 

```
Auth
 ↓
Merchant
 ↓
Karyawan
 ↓
Harga
 ↓
Transaksi
 ↓
Dashboard
```

## **Phase 2** 

Tambahkan: 

- Grafik revenue 

- Laporan mingguan 

- Laporan bulanan 

- Export Excel/CSV 

- Nama customer 

- Riwayat customer 

- Komisi karyawan 

24 

## **Phase 3** 

Tambahkan: 

- Booking 

- Membership 

- Loyalty 

- WhatsApp 

- Multi-cabang 

- Role Admin/Kasir/Karyawan 

## **Phase 4** 

SaaS monetization: 

```
Free
├── 1 merchant
├── 3 karyawan
└── basic dashboard
```

```
Pro
├── unlimited karyawan
├── laporan
├── export
└── customer database
```

# **38. Prinsip Bisnis SaaS** 

Aplikasi bukan dibuat hanya untuk satu barbershop. 

Harus sejak awal dipikirkan sebagai: 

```
1 aplikasi
     ↓
banyak merchant
     ↓
masing-masing memiliki data sendiri
```

Contoh: 

25 

```
Barber Jaya
├── Andi
├── Budi
└── 1.250 transaksi
Barber Makmur
├── Rudi
├── Dedi
└── 850 transaksi
Barber Santai
├── Asep
├── Doni
└── 420 transaksi
```

Semua berada di database Supabase yang sama tetapi terisolasi menggunakan <mark>`merchant_id + RLS` .</mark> 

# **39. Success Metrics MVP** 

MVP dianggap berhasil jika merchant dapat: 

1. Sign up 

2. Membuat profil usaha 

3. Menambahkan karyawan 

4. Menambahkan harga layanan 

5. Mencatat transaksi 

6. Melihat revenue hari ini 

7. Melihat jumlah customer 

8. Melihat revenue masing-masing karyawan 

Dan proses pencatatan satu transaksi dapat dilakukan dalam **beberapa detik tanpa mengetik banyak** . 

# **40. Core User Flow** 

```
SIGN UP
   ↓
EMAIL VERIFICATION
   ↓
LOGIN
   ↓
SETUP MERCHANT
   ↓
```

26 

```
TAMBAH KARYAWAN
   ↓
TAMBAH HARGA
   ↓
DASHBOARD
   ↓
+ TRANSAKSI
   ↓
PILIH PEMANGKAS
   ↓
PILIH LAYANAN
   ↓
HARGA OTOMATIS
   ↓
SIMPAN
   ↓
DASHBOARD UPDATE
```

# **41. Kesimpulan Produk** 

Produk ini sebaiknya diposisikan sebagai: 

#### **"Aplikasi pencatatan omzet barbershop yang simpel dan cepat."** 

Bukan: 

"Software manajemen barbershop yang lengkap." 

Fokus MVP hanya pada tiga hal: 

### **1. Siapa yang memangkas?** 

#### **Karyawan** 

### **2. Jasa apa yang diberikan?** 

**Paket/Layanan** 

### **3. Berapa hasilnya?** 

#### **Revenue & Customer** 

Dengan tiga data tersebut, dashboard sudah dapat memberikan informasi penting kepada pemilik usaha. 

27 

# **42. Stack Final** 

```
Frontend
HTML
CSS
JavaScript Vanilla
Hosting
Cloudflare Pages
Repository
GitHub
Backend
Supabase
Authentication
Supabase Auth
Database
Supabase PostgreSQL
Security
Supabase RLS
Storage
Supabase Storage
(untuk logo merchant)
```

### **Prinsip teknis** 

**No React No Firebase** 

**No D1 No backend server terpisah No service-role key di frontend** 

Aplikasi dibuat **ringan, mobile-first, cepat, dan mudah dikembangkan menjadi SaaS.** 

28 

