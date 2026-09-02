// js/employees.js
let editing = null;
let employeeList = [];

async function init() {
  const ctx = await requireMerchant();
  if (!ctx) return;
  if (!ctx.merchant) { location.href = 'dashboard.html'; return; }
  $('#header').innerHTML = `<div style="font-size:2rem">✂️</div>
    <div><div class="name">${ctx.merchant.name}</div><div class="tag">Master data karyawan</div></div>`;
  load();
  $('#form').onsubmit = save;
}

async function load() {
  const { data, error } = await db.from('employees').select('*').order('name');
  if (error) { $('#list').innerHTML = `<div class="empty card">Gagal memuat data.</div>`; return; }
  employeeList = data || [];

  if (!employeeList.length) {
    $('#list').innerHTML = `<div class="empty card"><div class="big">👤</div>
      Belum ada karyawan.<br>Tambah pemangkas rambut terlebih dahulu.</div>`;
    return;
  }

  $('#list').innerHTML = employeeList.map(e => `
    <div class="item" style="cursor:default">
      <div>
        <div class="title">✂️ ${e.name}</div>
        <span class="badge ${e.is_active ? 'on' : 'off'}">${e.is_active ? 'Aktif' : 'Nonaktif'}</span>
      </div>
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
function closeM() { $('#modal').classList.remove('open'); editing = null; $('#form').reset(); }

async function save(ev) {
  ev.preventDefault();
  const name = $('#name').value.trim();
  if (!name) return alert('Nama karyawan wajib diisi');
  const payload = { name };
  const { error } = editing
    ? await db.from('employees').update(payload).eq('id', editing)
    : await db.from('employees').insert(payload);
  if (error) return alert(error.message);
  closeM();
  load();
}

async function toggle(id, active) {
  const { error } = await db.from('employees').update({ is_active: !active }).eq('id', id);
  if (error) return alert(error.message);
  load();
}

function edit(id) {
  const e = employeeList.find(x => x.id === id);
  if (e) openModal(e);
}

init();
