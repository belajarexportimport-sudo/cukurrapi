// js/employees.js
let editing = null;

async function init() {
  const ctx = await requireMerchant(db); if (!ctx) return;
  $('#header').innerHTML = `<div style="font-size:2rem">✂️</div>
    <div><div class="name">${ctx.merchant.name}</div><div class="tag">Master data karyawan</div></div>`;
  load();
  $('#form').onsubmit = save;
}

async function load() {
  const { data } = await db.from('employees').select('*').order('name');
  if (!data?.length)
    return $('#list').innerHTML = `<div class="empty card"><div class="big">👤</div>
      Belum ada karyawan.<br>Tambah pemangkas rambut terlebih dahulu.</div>`;
  $('#list').innerHTML = data.map(e => `
    <div class="item">
      <div><div class="title">✂️ ${e.name}</div>
        <span class="badge ${e.is_active ? 'on' : 'off'}">${e.is_active ? 'Aktif' : 'Nonaktif'}</span></div>
      <div class="actions">
        <button onclick="toggle('${e.id}', ${e.is_active})">${e.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
        <button onclick="edit('${e.id}')">Edit</button>
      </div>
    </div>`).join('');
}

function openModal(e = null) {
  editing = e?.id || null;
  $('#m-title').textContent = e ? 'Edit Karyawan' : 'Tambah Karyawan';
  $('#name').value = e?.name || '';
  $('#modal').classList.add('open');
}
function closeM() { $('#modal').classList.remove('open'); }

async function save(ev) {
  ev.preventDefault();
  const payload = { name: $('#name').value.trim() };
  const { error } = editing
    ? await db.from('employees').update(payload).eq('id', editing)
    : await db.from('employees').insert(payload);
  if

> ⚠️ The response reached the length limit. Reply **continue** to get the rest.
// js/employees.js (lanjutan)
  if (error) return alert(error.message);
  closeM(); load();
}

async function toggle(id, active) {
  await db.from('employees').update({ is_active: !active }).eq('id', id);
  load();
}

async function edit(id) {
  const { data } = await db.from('employees').select('*').eq('id', id).single();
  openModal(data);
}

init();
