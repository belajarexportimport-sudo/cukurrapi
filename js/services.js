// js/services.js
let editing = null;

async function init() {
  const ctx = await requireMerchant(db); if (!ctx) return;
  $('#header').innerHTML = `<div style="font-size:2rem">✂️</div>
    <div><div class="name">${ctx.merchant.name}</div><div class="tag">Daftar harga layanan</div></div>`;
  load();
  $('#form').onsubmit = save;
}

async function load() {
  const { data } = await db.from('services').select('*').order('created_at');
  if (!data?.length)
    return $('#list').innerHTML = `<div class="empty card"><div class="big">💰</div>
      Belum ada harga layanan.<br>Tambahkan layanan pertama.</div>`;
  $('#list').innerHTML = data.map(s => `
    <div class="item">
      <div><div class="title">${s.name}</div>
        <div class="meta">${rupiah(s.price)}</div>
        <span class="badge ${s.is_active ? 'on' : 'off'}">${s.is_active ? 'Aktif' : 'Nonaktif'}</span></div>
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
  $('#price').value = s?.price || '';
  $('#modal').classList.add('open');
}
function closeM() { $('#modal').classList.remove('open'); }

async function save(ev) {
  ev.preventDefault();
  const price = Number($('#price').value);
  if (isNaN(price) || price < 0) return alert('Harga tidak valid');
  const payload = { name: $('#name').value.trim(), price };
  const { error } = editing
    ? await db.from('services').update(payload).eq('id', editing)
    : await db.from('services').insert(payload);
  if (error) return alert(error.message);
  closeM(); load();
}

async function toggle(id, active) {
  await db.from('services').update({ is_active: !active }).eq('id', id);
  load();
}

async function edit(id) {
  const { data } = await db.from('services').select('*').eq('id', id).single();
  openModal(data);
}

init();
