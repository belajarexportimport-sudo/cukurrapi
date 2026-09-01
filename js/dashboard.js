let range = 'today';

const ranges = {
  today:     () => [todayISO(), todayISO()],
  yesterday: () => { const d = new Date(Date.now() - 864e5).toISOString().slice(0,10); return [d, d]; },
  '7d':      () => { const d = new Date(Date.now() - 6*864e5).toISOString().slice(0,10); return [d, todayISO()]; },
  month:     () => { const n = new Date(); return [n.toISOString().slice(0,8)+'01', todayISO()]; },
};
$$('.filters button').forEach(b => b.onclick = () => {
  $$('.filters button').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  range = b.dataset.range;
  $('#custom-range').style.display = range === 'custom' ? 'block' : 'none';
  if (range !== 'custom') loadDashboard();
});

function dateFilter() {
  if (range === 'custom')
    return ['gte', $('#from').value || todayISO(), 'lte', $('#to').value || todayISO()];
  const [a, b] = ranges[range]();
  return ['gte', a, 'lte', b];
}

async function loadDashboard() {
  const ctx = await requireMerchant(db);
  if (!ctx) return;
  const { merchant } = ctx;

  // Header
  $('#header').innerHTML = `
    ${merchant.logo_url ? `<img class="logo" src="${merchant.logo_url}">` : '<div style="font-size:2rem">✂️</div>'}
    <div>
      <div class="name">${merchant.name || 'Usaha Anda'}</div>
      <div class="tag">Pencatatan omzet harian</div>
    </div>`;

  const [f1, d1, f2, d2] = dateFilter();
  const { data: trx } = await db.from('transactions')
    .select('price, employee_id, employees(name)')
    .gte('transaction_date', d1).lte('transaction_date', d2)
    .order('price', { referencedTable: 'employees', ascending: false });

  const revenue = (trx || []).reduce((s, t) => s + Number(t.price), 0);

  $('#stats').innerHTML = `
    <div class="stat"><div class="label">Revenue</div><div class="value">${rupiah(revenue)}</div></div>
    <div class="stat"><div class="label">Customer</div><div class="value">${trx?.length || 0}</div></div>
    <div class="stat"><div class="label">Transaksi</div><div class="value">${trx?.length || 0}</div></div>`;

  // Empty state
  if (!trx || trx.length === 0) {
    $('#perf').innerHTML = `<div class="empty card">
      <div class="big">💈</div>
      Belum ada transaksi pada periode ini.<br><br>
      <button class="btn btn-gold" onclick="location.href='transactions.html#new'">+ Tambah Transaksi</button>
    </div>`;
    return;
  }

  // Per karyawan, urut revenue terbesar
  const map = {};
  trx.forEach(t => {
    const n = t.employees?.name || '—';
    map[n] = map[n] || { rev: 0, count: 0 };
    map[n].rev += Number(t.price); map[n].count++;
  });
  const rows = Object.entries(map).sort((a, b) => b[1].rev - a[1].rev);

  $('#perf').innerHTML = rows.map(([name, s]) => `
    <div class="item">
      <div><div class="title">✂️ ${name}</div>
      <div class="meta">${s.count} customer</div></div>
      <div style="font-weight:800">${rupiah(s.rev)}</div>
    </div>`).join('');
}

loadDashboard();
