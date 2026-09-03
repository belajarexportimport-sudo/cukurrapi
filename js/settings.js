// js/settings.js
let currentMerchant = null;

async function init() {
  const ctx = await requireMerchant();
  if (!ctx) return;
  const { user, merchant } = ctx;
  currentMerchant = merchant;
  $('#acc-email').textContent = 'Email: ' + user.email;

  $('#m-name').value = merchant?.name || '';
  $('#m-phone').value = merchant?.phone || '';
  $('#m-address').value = merchant?.address || '';
  renderLogo(merchant?.logo_url);

  $('#form-merchant').onsubmit = saveMerchant;
  $('#logo-file').onchange = uploadLogo;

  const { data: adminRow } = await db.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (adminRow) $('#admin-link').style.display = 'block';
}

function renderLogo(url) {
  if (url) {
    $('#logo-preview').src = url;
    $('#logo-preview').style.display = 'block';
    $('#logo-empty').style.display = 'none';
  } else {
    $('#logo-preview').style.display = 'none';
    $('#logo-empty').style.display = 'block';
  }
}

async function saveMerchant(e) {
  e.preventDefault();
  const name = $('#m-name').value.trim();
  if (!name) return alert('Nama usaha wajib diisi');

  // Buat merchant jika belum ada (mis. onboarding dilewati total)
  if (!currentMerchant) {
    const { data: { user } } = await db.auth.getUser();
    const { data, error } = await db.from('merchants')
      .insert({ owner_id: user.id, name }).select().single();
    if (error) return alert(error.message);
    currentMerchant = data;
    toast('✅ Profil usaha dibuat');
    return;
  }

  const { error } = await db.from('merchants').update({
    name,
    phone: $('#m-phone').value.trim(),
    address: $('#m-address').value.trim(),
  }).eq('id', currentMerchant.id);
  if (error) return alert(error.message);
  currentMerchant.name = name;
  toast('✅ Profil usaha tersimpan');
}

async function uploadLogo() {
  const file = $('#logo-file').files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return alert('Ukuran file maksimal 2 MB');
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) return alert('Format harus JPG, PNG, atau WebP');

  if (!currentMerchant) return alert('Simpan profil usaha terlebih dahulu sebelum upload logo.');

  const { data: { user } } = await db.auth.getUser();
  const ext = file.name.split('.').pop();
  const path = `${user.id}/logo.${ext}`;

  const { error: upErr } = await db.storage.from('logos').upload(path, file, { upsert: true });
  if (upErr) return alert(upErr.message);

  const { data: { publicUrl } } = db.storage.from('logos').getPublicUrl(path);
  const { error } = await db.from('merchants')
    .update({ logo_url: publicUrl }).eq('id', currentMerchant.id);
  if (error) return alert(error.message);

  currentMerchant.logo_url = publicUrl;
  renderLogo(publicUrl + '?t=' + Date.now()); // cache-buster
}

async function removeLogo() {
  if (!currentMerchant?.logo_url) return;
  const { error } = await db.from('merchants').update({ logo_url: null }).eq('id', currentMerchant.id);
  if (error) return alert(error.message);
  currentMerchant.logo_url = null;
  renderLogo(null);
}

async function changePassword() {
  const pass = $('#new-pass').value;
  if (pass.length < 6) return alert('Password minimal 6 karakter');
  const { error } = await db.auth.updateUser({ password: pass });
  if (error) return alert(error.message);
  toast('✅ Password berhasil diubah');
  $('#new-pass').value = '';
}

init();
