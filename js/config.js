const SUPABASE_URL  = 'https://XXXX.supabase.co';   // ganti
const SUPABASE_ANON_KEY = 'eyJ...';                  // anon key (BOLEH di frontend)

// Helper
const rupiah = n => 'Rp ' + Number(n).toLocaleString('id-ID');
const $  = s => document.querySelector(s);
const  = s => document.querySelectorAll(s);
const todayISO = () => new Date().toISOString().slice(0,10);

async function requireMerchant(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { location.href = 'login.html'; return null; }
  const { data: merchant } = await supabase
    .from('merchants').select('*').eq('owner_id', user.id).maybeSingle();
  return { user, merchant };
}

async function logout(supabase) {
  await supabase.auth.signOut();
  location.href = 'login.html';
}
