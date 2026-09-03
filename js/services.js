// js/services.js
let editing = null;
let serviceList = [];

async function init() {
  const ctx = await requireMerchant();
  if (!ctx) return;
  if (!ctx.merchant || ctx.merchant.status !== 'approved') { location.href = 'dashboard.html'; return; }
  $('#header').innerHTML = `<div style="font-size:2rem">✂️</div>
    <div><div class="name">${ctx.merchant.name}</div><div class="tag">Daftar harga layanan</div></div>`;
  load();
  $('#form').onsubmit = save;
}

async function load() {
  const { data, error } = await db.from('services').select('*').order('created_at');
  if (error) { $('#list').innerHTML = `<div class="empty card">Gagal memuat data.</div>`; return; }
  serviceList = data || [];

  if (!serviceList.length) {
    $('#list').innerHTML = `<div class="empty card"><div class="big">💰</div>
      Belum ada harga layanan.<br>Tambahkan layanan pertama.</div>`;
    return;
  }

  $('#list').innerHTML = serviceList.map(s => `
    <div class="item" style="cursor:default">
      <div>
        <div class="title">${s.name}</div>
        <div class="meta">${rupiah(s.price)}</div>
        <span class="badge ${s.is_active ? 'on' : 'off'}">${s.is_active ? 'Aktif' : 'Nonaktif'}</span>
      </div>
      <div class="actions">
        <button onclick="toggle('${s.id}', ${s.is_active})">${s.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
        <button onclick="edit('${s.id}')">Edit</button>
      </div>
    </div>`).join('');
}

function openModal(s = null) {
  editing = s?.id || null;
  $('#m-title').textContent = s ? 'Edit Layanan' : 'Tambah Layanan';
  $('#name').value = s?.name || '';
  $('#price').value = s?.price ?? '';
  $('#modal').classList.add('open');
}
function closeM() { $('#modal').classList.remove('open'); editing = null; $('#form').reset(); }

async function save(ev) {
  ev.preventDefault();
  const name = $('#name').value.trim();
  const price = Number($('#price').value);
  if (!name) return alert('Nama layanan wajib diisi');
  if (isNaN(price) || price < 0) return alert('Harga tidak valid');
  const payload = { name, price };
  const { error } = editing
    ? await db.from('services').update(payload).eq('id', editing)
    : await db.from('services').insert(payload);
  if (error) return alert(error.message);
  closeM();
  load();
}

async function toggle(id, active) {
  const { error } = await db.from('services').update({ is_active: !active }).eq('id', id);
  if (error) return alert(error.message);
  load();
}

function edit(id) {
  const s = serviceList.find(x => x.id === id);
  if (s) openModal(s);
}

init();
