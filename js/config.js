// js/config.js
// GANTI dua nilai di bawah dengan punya project Supabase kamu sendiri.
// Anon/publishable key AMAN dipakai di frontend. JANGAN PERNAH taruh
// service_role key di sini atau di file frontend manapun.
const SUPABASE_URL = 'https://XXXX.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...';

// Supabase client (library dimuat lewat <script> sebelum file ini)
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// ===== Device kasir (dipakai bareng oleh transactions.js & attendance.js) =====
function getDeviceId() {
  let id = localStorage.getItem('bc_device_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('bc_device_id', id); }
  return id;
}

// Cek ke server siapa kasir yang terkunci ke device ini. Return null kalau
// device belum pernah didaftarkan.
async function resolveKasir() {
  const deviceId = getDeviceId();
  const { data } = await db.from('devices')
    .select('employee_id, employees(name)').eq('id', deviceId).maybeSingle();
  if (data) return { id: data.employee_id, name: data.employees?.name || '—', deviceId };
  return null;
}

// Daftarkan device ini terkunci ke seorang karyawan (sekali saja, tidak bisa diubah sendiri).
async function registerKasir(employeeId) {
  const deviceId = getDeviceId();
  const { error } = await db.from('devices').insert({ id: deviceId, employee_id: employeeId });
  return { error, deviceId };
}
