// js/dashboard.js
let range = 'today';

const ranges = {
  today:     () => [todayISO(), todayISO()],
  yesterday: () => { const d = shiftDate(-1); return [d, d]; },
  '7d':      () => [shiftDate(-6), todayISO()],
  month:     () => {
    const n = new Date();
    const first = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-01';
    return [first, todayISO()];
  },
};

function shiftDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const tz = d.getTime() - d.getTimezoneOffset() * 60000;
  return new Date(tz).toISOString().slice(0, 10);
}

function currentDateRange() {
  if (range === 'custom') {
    const from = $('#from').value || todayISO();
    const to = $('#to').value || todayISO();
    return [from, to];
  }
  return ranges[range]();
}

function renderHeader(merchant) {
  $('#header').innerHTML = `
    ${merchant.logo_url ? `<img class="logo" src="${merchant.logo_url}" alt="logo">` : '<div style="font-size:2rem">✂️</div>'}
    <div>
      <div class="name">${merchant.name || 'Usaha Anda'}</div>
      <div class="tag">Pencatatan omzet harian</div>
    </div>`;
}

async function loadDashboard() {
  const ctx = await requireMerchant();
  if (!ctx) return;
  const { merchant } = ctx;

  if (!merchant) {
    $('#header').innerHTML = `<div style="font-size:2rem">✂️</div><div><div class="name">Selamat datang</div></div>`;
    checkOnboarding(ctx);
    return;
  }

  renderHeader(merchant);

  const [d1, d2] = currentDateRange();
  const { data: trx, error } = await db.from('transactions')
    .select('price, employee_id, employees(name)')
    .gte('transaction_date', d1)
    .lte('transaction_date', d2);

  if (error) {
    console.error(error);
    $('#stats').innerHTML = '';
    $('#perf').innerHTML = '<div class="empty card">Gagal memuat data. Coba muat ulang halaman.</div>';
    return;
  }

  const revenue = (trx || []).reduce((s, t) => s + Number(t.price), 0);
  const count = trx?.length || 0;

  $('#stats').innerHTML = `
    <div class="stat"><div class="label">Revenue</div><div class="value">${rupiah(revenue)}</div></div>
    <div class="stat"><div class="label">Customer</div><div class="value">${count}</div></div>
    <div class="stat"><div class="label">Transaksi</div><div class="value">${count}</div></div>`;

  if (count === 0) {
    $('#perf').innerHTML = `<div class="empty card">
      <div class="big">💈</div>
      Belum ada transaksi pada periode ini.<br><br>
      <button class="btn btn-gold" onclick="location.href='transactions.html#new'">+ Tambah Transaksi</button>
    </div>`;
    return;
  }

  // Rekap per karyawan, urut revenue terbesar → terkecil
  const map = {};
  trx.forEach(t => {
    const n = t.employees?.name || '—';
    map[n] = map[n] || { rev: 0, count: 0 };
    map[n].rev += Number(t.price);
    map[n].count++;
  });
  const rows = Object.entries(map).sort((a, b) => b[1].rev - a[1].rev);

  $('#perf').innerHTML = rows.map(([name, s]) => `
    <div class="item" style="cursor:default">
      <div><div class="title">✂️ ${name}</div>
      <div class="meta">${s.count} customer</div></div>
      <div style="font-weight:800">${rupiah(s.rev)}</div>
    </div>`).join('');
}

function initFilters() {
  $$('.filters button').forEach(b => b.onclick = () => {
    $$('.filters button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    range = b.dataset.range;
    $('#custom-range').style.display = range === 'custom' ? 'flex' : 'none';
    if (range !== 'custom') loadDashboard();
  });
}

initFilters();
loadDashboard();
