// js/admin.js
let activeTab = 'pending';

async function init() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) { location.href = 'login.html'; return; }

  const { data: adminRow } = await db.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!adminRow) {
    $('#gate').innerHTML = `<div class="empty card">
      <div class="big">🚫</div>
      Halaman ini khusus admin. Akun kamu tidak punya akses.<br><br>
      <a class="btn btn-outline" href="dashboard.html">Kembali ke Dashboard</a>
    </div>`;
    return;
  }

  $('#admin-body').style.display = 'block';
  $$('#tab-filters button').forEach(b => b.onclick = () => {
    $$('#tab-filters button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    activeTab = b.dataset.status;
    load();
  });
  load();
  loadDevices();
}

async function load() {
  $('#list').innerHTML = '<div class="empty card">Memuat...</div>';
  const { data, error } = await db.from('merchants')
    .select('*').eq('status', activeTab).order('created_at', { ascending: false });

  if (error) { $('#list').innerHTML = `<div class="empty card">Gagal memuat: ${error.message}</div>`; return; }

  if (!data?.length) {
    $('#list').innerHTML = `<div class="empty card"><div class="big">📭</div>Tidak ada merchant di status ini.</div>`;
    return;
  }

  $('#list').innerHTML = data.map(m => `
    <div class="item" style="cursor:default;align-items:flex-start">
      <div>
        <div class="title">🏪 ${m.name}</div>
        <div class="meta">${m.phone || 'Tanpa nomor WA'}${m.address ? ' · ' + m.address : ''}</div>
        <div class="meta">Daftar: ${new Date(m.created_at).toLocaleString('id-ID')}</div>
      </div>
      <div class="actions" style="flex-direction:column;gap:6px">
        ${activeTab !== 'approved' ? `<button onclick="setStatus('${m.id}','approved')">✅ Approve</button>` : ''}
        ${activeTab !== 'rejected' ? `<button onclick="setStatus('${m.id}','rejected')">🚫 Reject</button>` : ''}
        ${activeTab !== 'pending' ? `<button onclick="setStatus('${m.id}','pending')">↩️ Pending-kan</button>` : ''}
      </div>
    </div>`).join('');
}

async function setStatus(id, status) {
  const { error } = await db.from('merchants').update({ status }).eq('id', id);
  if (error) return alert(error.message);
  toast(status === 'approved' ? '✅ Merchant disetujui' : status === 'rejected' ? '🚫 Merchant ditolak' : '↩️ Dikembalikan ke pending');
  load();
}

async function loadDevices() {
  const { data, error } = await db.from('devices')
    .select('id, created_at, employees(name), merchants(name)')
    .order('created_at', { ascending: false });

  if (error) { $('#device-list').innerHTML = `<div class="empty card">Gagal memuat: ${error.message}</div>`; return; }
  if (!data?.length) { $('#device-list').innerHTML = `<div class="empty card">Belum ada device terdaftar.</div>`; return; }

  $('#device-list').innerHTML = data.map(d => `
    <div class="item" style="cursor:default">
      <div>
        <div class="title">📱 ${d.employees?.name || '—'}</div>
        <div class="meta">${d.merchants?.name || '—'} · terdaftar ${new Date(d.created_at).toLocaleDateString('id-ID')}</div>
      </div>
      <div class="actions">
        <button onclick="resetDevice('${d.id}')">🔓 Reset</button>
      </div>
    </div>`).join('');
}

async function resetDevice(id) {
  if (!confirm('Reset device ini? HP tersebut wajib pilih nama kasir lagi saat transaksi berikutnya.')) return;
  const { error } = await db.from('devices').delete().eq('id', id);
  if (error) return alert(error.message);
  toast('🔓 Device direset');
  loadDevices();
}

init();
