// js/transactions.js
let employees = [], services = [];
let posEmployee = null;   // { id, name } dipilih di step 1
let editingId = null;
let saving = false;

async function init() {
  const ctx = await requireMerchant();
  if (!ctx) return;
  if (!ctx.merchant) { location.href = 'dashboard.html'; return; }
  const { merchant } = ctx;

  $('#header').innerHTML = `
    ${merchant.logo_url ? `<img class="logo" src="${merchant.logo_url}" alt="logo">` : '<div style="font-size:2rem">✂️</div>'}
    <div><div class="name">${merchant.name}</div>
    <div class="tag">Riwayat & pencatatan transaksi</div></div>`;

  const [empRes, svcRes] = await Promise.all([
    db.from('employees').select('*').eq('is_active', true).order('name'),
    db.from('services').select('*').eq('is_active', true).order('name'),
  ]);
  employees = empRes.data || [];
  services = svcRes.data || [];

  const opt = list => list.map(x => `<option value="${x.id}">${x.name}</option>`).join('');
  $('#e-employee').innerHTML = opt(employees);
  $('#e-service').innerHTML  = opt(services);
  $('#f-employee').innerHTML = '<option value="">Semua pemangkas</option>' + opt(employees);
  $('#f-service').innerHTML  = '<option value="">Semua layanan</option>' + opt(services);

  if (employees.length === 0 || services.length === 0) {
    $('#history').innerHTML = `<div class="empty card">
      <div class="big">✂️</div>
      ${employees.length === 0 ? 'Belum ada karyawan aktif.<br>Tambah dulu di menu <b>Karyawan</b>.<br><br>' : ''}
      ${services.length === 0 ? 'Belum ada layanan.<br>Tambah dulu di menu <b>Harga Paket</b>.' : ''}
    </div>`;
    $('#fab').style.display = 'none';
    return;
  }

  ['#f-date', '#f-employee', '#f-service'].forEach(sel => $(sel).onchange = loadHistory);
  $('#edit-form').onsubmit = saveEdit;
  loadHistory();

  if (location.hash === '#new') openPos();
}

/* ================= POS quick-add flow ================= */

function openPos() {
  posEmployee = null;
  $('#pos-step-employee').style.display = 'block';
  $('#pos-step-service').style.display = 'none';
  $('#pos-step-done').style.display = 'none';
  $('#pos-back').style.visibility = 'hidden';
  $('#pos-title').textContent = 'Pilih Pemangkas';
  $('#pos-time-box').classList.remove('open');
  $('#pos-date').value = todayISO();
  $('#pos-time').value = nowHHMM();

  $('#pos-employees').innerHTML = employees.map(e => `
    <button type="button" class="pos-btn" onclick='selectPosEmployee(${JSON.stringify(e.id)}, ${JSON.stringify(e.name)})'>
      <span class="ic">✂️</span><span class="n">${e.name}</span>
    </button>`).join('');

  $('#pos-modal').classList.add('open');
}

function closePos() {
  $('#pos-modal').classList.remove('open');
  history.replaceState(null, '', location.pathname);
}

function selectPosEmployee(id, name) {
  posEmployee = { id, name };
  $('#pos-step-employee').style.display = 'none';
  $('#pos-step-service').style.display = 'block';
  $('#pos-back').style.visibility = 'visible';
  $('#pos-title').textContent = 'Pilih Layanan';
  $('#pos-selected-employee').textContent = '✂️ ' + name;

  $('#pos-services').innerHTML = services.map(s => `
    <button type="button" class="pos-btn" onclick='selectPosService(${JSON.stringify(s.id)}, ${JSON.stringify(s.name)}, ${s.price})'>
      <span class="n">${s.name}</span><span class="p">${rupiah(s.price)}</span>
    </button>`).join('');
}

function posBack() {
  posEmployee = null;
  $('#pos-step-service').style.display = 'none';
  $('#pos-step-employee').style.display = 'block';
  $('#pos-back').style.visibility = 'hidden';
  $('#pos-title').textContent = 'Pilih Pemangkas';
}

function toggleTime() {
  $('#pos-time-box').classList.toggle('open');
}

async function selectPosService(id, name, price) {
  if (saving || !posEmployee) return;
  saving = true;

  const payload = {
    employee_id: posEmployee.id,
    service_id: id,
    price,
    transaction_date: $('#pos-date').value || todayISO(),
    transaction_time: $('#pos-time').value || nowHHMM(),
  };
  const { error } = await db.from('transactions').insert(payload);
  saving = false;

  if (error) { alert(error.message); return; }

  $('#pos-step-service').style.display = 'none';
  $('#pos-step-done').style.display = 'block';
  $('#pos-back').style.visibility = 'hidden';
  $('#pos-title').textContent = 'Tersimpan';
  $('#pos-done-amt').textContent = rupiah(price);
  $('#pos-done-desc').textContent = `${posEmployee.name} · ${name}`;

  loadHistory();
}

function posAgain() {
  openPos();
}

/* ================= Edit transaksi lama ================= */

async function editTrx(id) {
  const { data, error } = await db.from('transactions').select('*').eq('id', id).single();
  if (error) return alert(error.message);
  editingId = id;
  $('#e-employee').value = data.employee_id;
  $('#e-service').value = data.service_id;
  $('#e-price').value = data.price;
  $('#e-date').value = data.transaction_date;
  $('#e-time').value = data.transaction_time.slice(0, 5);
  $('#edit-modal').classList.add('open');
}
function closeEdit() {
  $('#edit-modal').classList.remove('open');
  editingId = null;
}

async function saveEdit(e) {
  e.preventDefault();
  const price = Number($('#e-price').value);
  if (isNaN(price) || price < 0) return alert('Harga tidak valid');

  const payload = {
    employee_id: $('#e-employee').value,
    service_id:  $('#e-service').value,
    price,
    transaction_date: $('#e-date').value,
    transaction_time: $('#e-time').value,
  };
  const btn = $('#edit-form button[type=submit]');
  btn.disabled = true;
  const { error } = await db.from('transactions').update(payload).eq('id', editingId);
  btn.disabled = false;
  if (error) return alert(error.message);
  closeEdit();
  toast('✅ Perubahan tersimpan');
  loadHistory();
}

async function deleteTrx(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  const { error } = await db.from('transactions').delete().eq('id', id);
  if (error) return alert(error.message);
  loadHistory();
}

/* ================= Riwayat ================= */

async function loadHistory() {
  let q = db.from('transactions')
    .select('*, employees(name), services(name)')
    .order('transaction_date', { ascending: false })
    .order('transaction_time', { ascending: false })
    .limit(100);
  if ($('#f-date').value) q = q.eq('transaction_date', $('#f-date').value);
  if ($('#f-employee').value) q = q.eq('employee_id', $('#f-employee').value);
  if ($('#f-service').value) q = q.eq('service_id', $('#f-service').value);

  const { data: trx, error } = await q;
  if (error) { $('#history').innerHTML = `<div class="empty card">Gagal memuat riwayat.</div>`; return; }

  if (!trx?.length) {
    $('#history').innerHTML = `<div class="empty card"><div class="big">✂️</div>
      Belum ada transaksi pada filter ini.<br>Yuk catat transaksi pertama!</div>`;
    return;
  }

  $('#history').innerHTML = trx.map(t => `
    <div class="item" onclick="editTrx('${t.id}')">
      <div>
        <div class="title">${t.transaction_time.slice(0, 5)} · ${t.employees?.name || '—'}</div>
        <div class="meta">${t.services?.name || '—'}</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:800">${rupiah(t.price)}</div>
        <button onclick="event.stopPropagation();deleteTrx('${t.id}')"
          style="margin-top:4px;background:#fee2e2;border:0;border-radius:8px;padding:4px 8px;font-size:.72rem;cursor:pointer">Hapus</button>
      </div>
    </div>`).join('');
}

init();
