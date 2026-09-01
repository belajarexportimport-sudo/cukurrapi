// js/settings.js
async function init() {
  const ctx = await requireMerchant(db); if (!ctx) return;
  const { user, merchant } = ctx;
  $('#acc-email').textContent = 'Email: ' + user.email;

  $('#m-name').value = merchant?.name || '';
  $('#m-phone').value = merchant?.phone || '';
  $('#m-address').value = merchant?.address || '';
  renderLogo(merchant?.logo_url);

  $('#form-merchant').onsubmit = saveMerchant;
  $('#logo-file').onchange = uploadLogo;
}

function renderLogo(url) {
  if (url) { $('#logo-preview').src = url; $('#logo-preview').style.display = 'block'; $('#logo-empty').style.display = 'none'; }
  else { $('#logo-preview').style.display = 'none'; $('#logo-empty').style.display = 'block'; }
}

async function saveMerchant(e) {
  e.preventDefault();
  const { user, merchant } = (await requireMerchant(db));

  // Buat merchant jika belum ada (mis. onboarding dilewati)
  if (!merchant) {
    const { data, error } = await db.from('merchants')
      .insert({ owner_id: user.id, name: $('#m-name').value.trim() }).select().single();
    if (error) return alert(error.message);
    return init();
  }

  const { error } = await db.from('merchants').update({
    name: $('#m-name').value.trim(),
    phone: $('#m-phone').value.trim(),
    address: $('#m-address').value.trim(),
    updated_at: new Date().toISOString(),
  }).eq('id', merchant.id);
  error ? alert(error.message) : alert('✅ Profil usaha tersimpan');
}

async function uploadLogo() {
  const file = $('#logo-file').files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return alert('Maksimal 2 MB');
  const { user, merchant } = await requireMerchant(db);
  const ext = file.name.split('.').pop();
  const path = `${user.id}/logo.${ext}`;

  const { error } = await db.storage.from('logos').upload(path, file, { upsert: true });
  if (error) return alert(error.message);

  const { data: { publicUrl } } = db.storage.from('logos').getPublicUrl(path);
  await db.from('merchants').update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', merchant.id);
  renderLogo(publicUrl + '?t=' + Date.now()); // cache-buster
}

async function removeLogo() {
  const { merchant } = await requireMerchant(db);
  if (!merchant?.logo_url) return;
  await db.from('merchants').update({ logo_url: null }).eq('id', merchant.id);
  renderLogo(null);
}

async function changePassword() {
  const pass = $('#new-pass').value;
  if (pass.length < 6) return alert('Minimal 6 karakter');
  const { error } = await db.auth.updateUser({ password: pass });
  alert(error ? error.message : '✅ Password berhasil diubah');
  $('#new-pass').value = '';
}

init();
