// js/config.js
// GANTI dua nilai di bawah dengan punya project Supabase kamu sendiri.
// Anon/publishable key AMAN dipakai di frontend. JANGAN PERNAH taruh
// service_role key di sini atau di file frontend manapun.
const SUPABASE_URL = 'https://oeofrkomqvanpvyipufv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lb2Zya29tcXZhbnB2eWlwdWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTkwMDYsImV4cCI6MjEwMzgzNTAwNn0.7KiNA727TE6EAUVpqfI4KUE12yc7lP1u6Jh8xhwKKRE';

// Supabase client (library dimuat lewat <script> sebelum file ini)
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Nomor WA admin/CS untuk info berlangganan (format internasional tanpa
// + atau 0 di depan, mis. 62812xxxxxxx). GANTI dengan nomor kamu sendiri.
const ADMIN_WA_NUMBER = '6281290650963';
const ADMIN_WA_LINK = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent('Halo, saya mau lanjut berlangganan BarberCatat')}`;

// Helper DOM & format
const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const rupiah = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const todayISO = () => {
  const d = new Date();
  const tz = d.getTime() - d.getTimezoneOffset() * 60000;
  return new Date(tz).toISOString().slice(0, 10);
};
const nowHHMM = () => {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// Pastikan user sudah login, dan kembalikan { user, merchant } miliknya.
// merchant bisa null jika user belum pernah menyelesaikan onboarding.
async function requireMerchant() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) { location.href = 'login.html'; return null; }
  const { data: merchant, error } = await db
    .from('merchants').select('*').eq('owner_id', user.id).maybeSingle();
  if (error) { console.error(error); }
  return { user, merchant: merchant || null };
}

async function logout() {
  await db.auth.signOut();
  location.href = 'login.html';
}

// Merchant dianggap "aktif" (boleh pakai semua fitur) kalau statusnya
// approved, ATAU statusnya masih pending tapi masa trial belum habis.
function merchantActive(merchant) {
  if (!merchant) return false;
  if (merchant.status === 'approved') return true;
  if (merchant.status === 'pending' && merchant.trial_ends_at) {
    return new Date(merchant.trial_ends_at) > new Date();
  }
  return false;
}

// Sisipkan banner kecil "sisa trial" setelah header, di halaman mana pun.
// Tidak melakukan apa-apa kalau bukan trial aktif (mis. sudah approved).
function renderTrialBanner(merchant) {
  if (!merchant || merchant.status !== 'pending' || !merchant.trial_ends_at) return;
  const msLeft = new Date(merchant.trial_ends_at) - new Date();
  if (msLeft <= 0 || document.getElementById('trial-banner')) return;
  const daysLeft = Math.max(1, Math.ceil(msLeft / 86400000));
  const el = document.createElement('div');
  el.id = 'trial-banner';
  el.style.cssText = 'background:#fff8e6;border:1px solid #f0dca0;border-radius:12px;' +
    'padding:10px 14px;margin-bottom:12px;font-size:.82rem;display:flex;' +
    'justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap';
  el.innerHTML = `
    <span>⏳ Masa coba gratis: sisa <b>${daysLeft} hari</b></span>
    <a href="${ADMIN_WA_LINK}" target="_blank"
      style="background:#1a1a2e;color:#fff;border-radius:8px;padding:5px 12px;
      font-size:.75rem;text-decoration:none;white-space:nowrap">Hubungi Admin</a>`;
  const header = $('#header');
  (header?.parentElement || $('.app-content') || document.body)
    .insertBefore(el, header ? header.nextSibling : null);
}

// Popup peringatan kalau trial sisa ≤3 hari -- muncul cuma 1x per hari
// (per browser) biar tidak mengganggu tiap pindah halaman. Dipanggil
// bersamaan dengan renderTrialBanner() di setiap halaman.
function maybeShowTrialPopup(merchant) {
  if (!merchant || merchant.status !== 'pending' || !merchant.trial_ends_at) return;
  const msLeft = new Date(merchant.trial_ends_at) - new Date();
  if (msLeft <= 0) return; // sudah habis -> ada layar kunci sendiri di dashboard, tidak perlu popup lagi
  const daysLeft = Math.ceil(msLeft / 86400000);
  if (daysLeft > 3) return;

  const todayKey = 'trial_popup_' + todayISO();
  if (localStorage.getItem(todayKey)) return; // sudah muncul hari ini
  localStorage.setItem(todayKey, '1');

  const bg = document.createElement('div');
  bg.className = 'modal-bg open';
  bg.innerHTML = `
    <div class="modal" style="text-align:center">
      <div style="font-size:2.5rem">⏳</div>
      <h3>Trial tinggal ${daysLeft} hari lagi!</h3>
      <p style="color:var(--muted,#777);margin:8px 0 18px">
        Supaya <b>${escapeHtmlSafe(merchant.name)}</b> tidak berhenti mencatat transaksi,
        yuk hubungi admin sekarang untuk lanjut berlangganan.
      </p>
      <a class="btn btn-gold" href="${ADMIN_WA_LINK}" target="_blank"
        style="display:block;text-decoration:none;margin-bottom:10px">💬 Hubungi Admin via WhatsApp</a>
      <button class="btn btn-outline" style="width:100%" type="button"
        onclick="this.closest('.modal-bg').remove()">Nanti Saja</button>
    </div>`;
  document.body.appendChild(bg);
}

function escapeHtmlSafe(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

// ===== Device kasir (dipakai bareng oleh transactions.js & attendance.js) =====
function getDeviceId() {
  let id = localStorage.getItem('bc_device_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('bc_device_id', id); }
  return id;
}

// Cek ke server siapa kasir yang terdaftar untuk HP ini, khusus di
// merchant yang sedang login. Return null kalau device belum pernah
// didaftarkan DI MERCHANT INI (device yang sama bisa saja sudah
// terdaftar di merchant lain -- itu tidak dihitung).
async function resolveKasir(merchantId) {
  const deviceId = getDeviceId();
  const { data } = await db.from('devices')
    .select('employee_id, employees(name)')
    .eq('id', deviceId).eq('merchant_id', merchantId).maybeSingle();
  if (data) return { id: data.employee_id, name: data.employees?.name || '—', deviceId };
  return null;
}

// Daftarkan (atau GANTI) kasir HP ini untuk merchant yang sedang login.
// Dipakai baik saat pertama kali pilih nama, maupun saat kasir sedang
// aktif menekan "Ganti Kasir" -- keduanya upsert ke row (device, merchant)
// yang sama, jadi tidak perlu peran admin.
async function registerKasir(employeeId, merchantId) {
  const deviceId = getDeviceId();
  const { error } = await db.from('devices')
    .upsert({ id: deviceId, employee_id: employeeId, merchant_id: merchantId });
  return { error, deviceId };
}
