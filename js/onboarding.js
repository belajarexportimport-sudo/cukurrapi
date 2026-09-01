// js/onboarding.js — load di dashboard.html sebelum dashboard.js
async function checkOnboarding(ctx) {
  if (ctx.merchant) return; // sudah setup

  const businessName = ctx.user.user_metadata?.business_name || '';
  $('#app-content').innerHTML = `
    <div class="card" style="margin-top:20px">
      <h2 style="text-align:center">🚀 Yuk Setup Usaha Kamu</h2>
      <div style="margin-top:16px">

        <div class="onb-step active" data-step="1">
          <label>Nama usaha Anda?</label>
          <input id="onb-name" value="${businessName}" placeholder="Barber Jaya">
          <div style="display:flex;gap:8px;margin-top:14px">
            <button class="btn btn-outline" onclick="skipOnboarding()">Lewati</button>
            <button class="btn btn-gold" style="flex:1" onclick="onbCreateMerchant()">Lanjut →</button>
          </div>
        </div>

        <div class="onb-step" data-step="2">
          <p><b>Step 2/4</b> — Tambahkan layanan pertama</p>
          <label>Nama layanan</label><input id="onb-service" placeholder="Potong Rambut">
          <label>Harga (Rp)</label><input id="onb-price" type="number" placeholder="30000">
          <button class="btn btn-gold" style="margin-top:14px" onclick="onbAddService()">Lanjut →</button>
        </div>

        <div class="onb-step" data-step="3">
          <p><b>Step 3/4</b> — Tambahkan pemangkas</p>
          <label>Nama pemangkas</label><input id="onb-employee" placeholder="Andi">
          <button class="btn btn-gold" style="margin-top:14px" onclick="onbAddEmployee()">Lanjut →</button>
        </div>

        <div class="onb-step" data-step="4">
          <div class="empty"><div class="big">🎉</div>
            <b>Selesai! Anda siap mencatat transaksi.</b></div>
          <button class="btn btn-primary" onclick="location.reload()">Buka Dashboard</button>
        </div>

      </div>
    </div>`;
}

function onbGo(step) {
  document.querySelectorAll('.onb-step').forEach(s =>
    s.classList.toggle('active', s.dataset.step == step));
}
function skipOnboarding() { location.href = 'settings.html'; } // bisa diisi nanti

async function onbCreateMerchant() {
  const name = $('#onb-name').value.trim();
  if (!name) return alert('Nama usaha wajib diisi');
  const { user } = await requireMerchant(db);
  const { error } = await db.from('merchants').insert({ owner_id: user.id, name });
  if (error) return alert(error.message);
  onbGo(2);
}
async function onbAddService() {
  const { merchant } = await requireMerchant(db);
  await db.from('services').insert({
    merchant_id: merchant.id,
    name: $('#onb-service').value.trim() || 'Potong Rambut',
    price: Number($('#onb-price').value) || 0
  });
  onbGo(3);
}
async function onbAddEmployee() {
  const { merchant } = await requireMerchant(db);
  const name = $('#onb-employee').value.trim();
  if (name) await db.from('employees').insert({ merchant_id: merchant.id, name });
  onbGo(4);
}
