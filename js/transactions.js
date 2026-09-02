// js/transactions.js
let employees = [], services = [], editingId = null;

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
  $('#t-employee').innerHTML = opt(employees);
  $('#t-service').innerHTML  = opt(services);
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

  // Harga otomatis saat layanan dipilih
  $('#t-service').onchange = () => {
    const s = services.find(x => x.id === $('#t-service').value);
    if (s) $('#t-price').value = s.price;
  };

  ['#f-date', '#f-employee', '#f-service'].forEach(sel => $(sel).onchange = loadHistory);
  $('#trx-form').onsubmit = saveTrx;
  loadHistory();

  if (location.hash === '#new') openModal();
}

function openModal(trx = null) {
  editingId = trx?.id || null;
  $('#modal-title').textContent = trx ? 'Edit Transaksi' : 'Tambah Transaksi';
  $('#t-date').value = trx?.transaction_date || todayISO();
  $('#t-time').value = trx?.transaction_time?.slice(0, 5) || nowHHMM();
  if (trx) {
    $('#t-employee').value = trx.employee_id;
    $('#t-service').value = trx.service_id;
    $('#t-price').value = trx.price;
  } else {
    $('#trx-form').reset();
    $('#t-date').value = todayISO();
    $('#t-time').value = nowHHMM();
    $('#t-price').value = services[0]?.price ?? '';
  }
  $('#modal').classList.add('open');
}
function closeModal() {
  $('#modal').classList.remove('open');
  editingId = null;
  history.replaceState(null, '', location.pathname);
}

async function saveTrx(e) {
  e.preventDefault();
  const price = Number($('#t-price').value);
  if (isNaN(price) || price < 0) return alert('Harga tidak valid');
  if (!$('#t-employee').value || !$('#t-service').value) return alert('Pilih pemangkas dan layanan');

  const payload = {
    employee_id: $('#t-employee').value,
    service_id:  $('#t-service').value,
    price,
    transaction_date: $('#t-date').value,
    transaction_time: $('#t-time').value,
  };
  const submitBtn = $('#trx-form button[type=submit]');
  submitBtn.disabled = true;
  const q = editingId
    ? db.from('transactions').update(payload).eq('id', editingId)
    : db.from('transactions').insert(payload);
  const { error } = await q;
  submitBtn.disabled = false;
  if (error) return alert(error.message);
  closeModal();
  toast('✅ Transaksi tersimpan');
  loadHistory();
}

async function editTrx(id) {
  const { data, error } = await db.from('transactions').select('*').eq('id', id).single();
  if (error) return alert(error.message);
  openModal(data);
}
async function deleteTrx(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  const { error } = await db.from('transactions').delete().eq('id', id);
  if (error) return alert(error.message);
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
