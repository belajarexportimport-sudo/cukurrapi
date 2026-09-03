// js/config.js
// GANTI dua nilai di bawah dengan punya project Supabase kamu sendiri.
// Anon/publishable key AMAN dipakai di frontend. JANGAN PERNAH taruh
// service_role key di sini atau di file frontend manapun.
const SUPABASE_URL = 'https://oeofrkomqvanpvyipufv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lb2Zya29tcXZhbnB2eWlwdWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTkwMDYsImV4cCI6MjEwMzgzNTAwNn0.7KiNA727TE6EAUVpqfI4KUE12yc7lP1u6Jh8xhwKKRE';

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
