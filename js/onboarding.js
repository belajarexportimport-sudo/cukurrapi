// js/onboarding.js — dimuat di dashboard.html, sebelum js/dashboard.js
// Menampilkan wizard 4 langkah jika user belum punya merchant.

let onbUser = null;

function checkOnboarding(ctx) {
  if (ctx.merchant) return false; // sudah setup, tidak perlu onboarding
  onbUser = ctx.user;

  const businessName = ctx.user.user_metadata?.business_name || '';
  $('#app-content').innerHTML = `
    <div class="card" style="margin-top:12px">
      <h2 style="text-align:center">🚀 Yuk Setup Usaha Kamu</h2>

      <div class="onb-step active" data-step="1">
        <p class="onb-progress">Langkah 1/4</p>
        <label>Nama usaha Anda?</label>
        <input id="onb-name" value="${escapeHtml(businessName)}" placeholder="Barber Jaya">
        <div style="display:flex;gap:8px;margin-top:14px">
          <button type="button" class="btn btn-outline" onclick="onbSkipAll()">Lewati semua</button>
          <button type="button" class="btn btn-gold" style="flex:1" onclick="onbCreateMerchant()">Lanjut →</button>
        </div>
      </div>

      <div class="onb-step" data-step="2">
        <p class="onb-progress">Langkah 2/4</p>
        <p style="margin-bottom:10px"><b>Tambahkan layanan pertama</b></p>
        <label>Nama layanan</label><input id="onb-service" placeholder="Potong Rambut">
        <label>Harga (Rp)</label><input id="onb-price" type="number" min="0" placeholder="30000">
        <div style="display:flex;gap:8px;margin-top:14px">
          <button type="button" class="btn btn-outline" onclick="onbGo(3)">Lewati</button>
          <button type="button" class="btn btn-gold" style="flex:1" onclick="onbAddService()">Lanjut →</button>
        </div>
      </div>

      <div class="onb-step" data-step="3">
        <p class="onb-progress">Langkah 3/4</p>
        <p style="margin-bottom:10px"><b>Tambahkan pemangkas</b></p>
        <label>Nama pemangkas</label><input id="onb-employee" placeholder="Andi">
        <div style="display:flex;gap:8px;margin-top:14px">
          <button type="button" class="btn btn-outline" onclick="onbGo(4)">Lewati</button>
          <button type="button" class="btn btn-gold" style="flex:1" onclick="onbAddEmployee()">Lanjut →</button>
        </div>
      </div>

      <div class="onb-step" data-step="4">
        <div class="empty"><div class="big">🎉</div>
          <b>Profil usaha berhasil dibuat!</b><br>
          Akun kamu akan ditinjau oleh admin sebelum bisa mulai mencatat transaksi.
          Biasanya tidak lama — cek lagi ya.</div>
        <button type="button" class="btn btn-primary" onclick="location.reload()">Lihat Status Akun</button>
      </div>
    </div>`;
  return true;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function onbGo(step) {
  $$('.onb-step').forEach(s => s.classList.toggle('active', s.dataset.step == step));
}

async function onbCreateMerchant() {
  const name = $('#onb-name').value.trim();
  if (!name) return alert('Nama usaha wajib diisi');
  const { error } = await db.from('merchants').insert({ owner_id: onbUser.id, name });
  if (error) return alert(error.message);
  onbGo(2);
}

// "Lewati semua": tetap buat merchant (wajib agar bisa masuk dashboard),
// pakai nama default kalau kosong, lalu langsung ke step selesai.
async function onbSkipAll() {
  const name = $('#onb-name').value.trim() || 'Usaha Saya';
  const { error } = await db.from('merchants').insert({ owner_id: onbUser.id, name });
  if (error) return alert(error.message);
  onbGo(4);
}

async function onbAddService() {
  const name = $('#onb-service').value.trim();
  const price = Number($('#onb-price').value);
  if (!name) return alert('Nama layanan wajib diisi');
  if (isNaN(price) || price < 0) return alert('Harga tidak valid');
  const { error } = await db.from('services').insert({ name, price });
  if (error) return alert(error.message);
  onbGo(3);
}

async function onbAddEmployee() {
  const name = $('#onb-employee').value.trim();
  if (!name) return alert('Nama pemangkas wajib diisi');
  const { error } = await db.from('employees').insert({ name });
  if (error) return alert(error.message);
  onbGo(4);
}
