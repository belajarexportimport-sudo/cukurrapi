let employees = [], services = [], editingId = null;

async function init() {
  const ctx = await requireMerchant(db);
  if (!ctx) return;
  const { merchant } = ctx;
  $('#header').innerHTML = `
    ${merchant.logo_url ? `<img class="logo" src="${merchant.logo_url}">` : '<div style="font-size:2rem">✂️</div>'}
    <div><div class="name">${merchant.name}</div>
    <div class="tag">Riwayat & pencatatan transaksi</div></div>`;

  [employees, services] = await Promise.all([
    db.from('employees').select('*').eq('is_active', true).order('name').then(r => r.data || []),
    db.from('services').select('*').eq('is_active', true).order('name').then(r => r.data || []),
  ]);

  const opt = (a) => a.map(x => `<option value="${x.id}">${x.name}</option>`).join('');
  $('#t-employee').innerHTML = opt(employees);
  $('#t-service').innerHTML  = opt(services);
  $('#f-employee').innerHTML = '<option value="">Semua pemangkas</option>' + opt(employees);
  $('#f-service').innerHTML  = '<option value="">Semua layanan</option>' + opt(services);
  $('#f-date').value = todayISO();

  if (employees.length === 0 || services.length === 0) {
    $('#history').innerHTML = `<div class="empty card">
      ${employees.length === 0 ? 'Belum ada karyawan aktif.<br>Tambah dulu di menu <b>Karyawan</b>.<br><br>' : ''}
      ${services.length === 0 ? 'Belum ada layanan.<br>Tambah dulu di menu <b>Harga Paket</b>.' : ''}</div>`;
    return;
  }

  // Harga otomatis saat layanan dipilih
  $('#t-service').onchange = () => {
    const s = services.find(x => x.id === $('#t-service').value);
    if (s) $('#t-price').value = s.price;
  };

  ['#f-date', '#f-employee', '#f-service'].forEach(s => $(s).onchange = loadHistory);
  $('#trx-form').onsubmit = saveTrx;
  loadHistory();

  if (location.hash === '#new') openModal();
}

function openModal(trx = null) {
  editingId = trx?.id || null;
  $('#modal-title').textContent = trx ? 'Edit Transaksi' : 'Tambah Transaksi';
  const now = new Date();
  $('#t-date').value = trx?.transaction_date || todayISO();
  $('#t-time').value = trx?.transaction_time || now.toTimeString().slice(0,5);
  if (trx) {
    $('#t-employee').value = trx.employee_id;
    $('#t-service').value = trx.service_id;
    $('#t-price').value = trx.price;
  } else {
    $('#t-price').value = services[0]?.price || '';
  }
  $('#modal').classList.add('open');
}
function closeModal() { $('#modal').classList.remove('open'); editingId = null; }

async function saveTrx(e) {
  e.preventDefault();
  const payload = {
    employee_id: $('#t-employee').value,
    service_id:  $('#t-service').value,
    price:       Number($('#t-price').value),
    transaction_date: $('#t-date').value,
    transaction_time: $('#t-time').value,
  };
  const q = editingId
    ? db.from('transactions').update(payload).eq('id', editingId)
    : db.from('transactions').insert(payload);
  const { error } = await q;
  if (error) return alert(error.message);
  closeModal(); loadHistory();
}

async function editTrx(id) {
  const { data } = await db.from('transactions').select('*').eq('id', id).single();
  openModal(data);
}
async function deleteTrx(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  await db.from('transactions').delete().eq('id', id);
  loadHistory();
}

async function loadHistory() {
  let q = db.from('transactions')
    .select('*, employees(name), services(name)')
    .order('transaction_date', { ascending: false })
    .order('transaction_time', { ascending: false })
    .limit(100);
  if ($('#f-date').value) q = q.eq('transaction_date', $('#f-date').value);
  if ($('#f-employee').value) q = q.eq('employee_id', $('#f-employee').value);
  if ($('#f-service').value) q = q.eq('service_id', $('#f-service').value);

  const { data: trx } = await q;
  if (!trx?.length)
    return $('#history').innerHTML = `<div class="empty card"><div class="big">✂️</div>
      Belum ada transaksi pada filter ini.<br>Yuk catat transaksi pertama!</div>`;

  $('#history').innerHTML = trx.map(t => `
    <div class="item" onclick="editTrx('${t.id}')">
      <div>
        <div class="title">${t.transaction_time.slice(0,5)} &middot; ${t.employees?.name}</div>
        <div class="meta">${t.services?.name}</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:800">${rupiah(t.price)}</div>
        <button onclick="event.stopPropagation();deleteTrx('${t.id}')"
          style="margin-top:4px;background:#fee2e2;border:0;border-radius:8px;padding:4px 8px;font-size:.72rem;cursor:pointer">Hapus</button>
      </div>
    </div>`).join('');
}

init();
