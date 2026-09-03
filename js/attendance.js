// js/attendance.js
let kasir = null;
let merchantId = null;
let pendingAction = null; // 'in' | 'out' — dipakai file input tahu ini lagi ngapain
let openAttendanceId = null; // id absensi hari ini yang belum check-out

async function init() {
  const ctx = await requireMerchant();
  if (!ctx) return;
  if (!ctx.merchant || ctx.merchant.status !== 'approved') { location.href = 'dashboard.html'; return; }
  const { merchant } = ctx;
  merchantId = merchant.id;

  $('#header').innerHTML = `
    ${merchant.logo_url ? `<img class="logo" src="${merchant.logo_url}" alt="logo">` : '<div style="font-size:2rem">✂️</div>'}
    <div><div class="name">${merchant.name}</div><div class="tag">Absensi karyawan</div></div>`;

  kasir = await resolveKasir();
  if (kasir) {
    renderKasirBar();
  } else {
    const { data: emp } = await db.from('employees').select('*').eq('is_active', true).order('name');
    $('#kasir-employees').innerHTML = (emp || []).map(e => `
      <button type="button" class="pos-btn" onclick='selectKasir(${JSON.stringify(e.id)}, ${JSON.stringify(e.name)})'>
        <span class="ic">✂️</span><span class="n">${e.name}</span>
      </button>`).join('');
    $('#kasir-modal').classList.add('open');
  }

  $('#cam-input').onchange = handlePhoto;
  if (kasir) loadStatus();
  loadToday();
}

function renderKasirBar() {
  $('#kasir-bar').style.display = 'flex';
  $('#kasir-name').textContent = kasir?.name || '-';
}

async function selectKasir(id, name) {
  const { error, deviceId } = await registerKasir(id);
  if (error) { alert('Gagal mendaftarkan device: ' + error.message); return; }
  kasir = { id, name, deviceId };
  renderKasirBar();
  $('#kasir-modal').classList.remove('open');
  loadStatus();
}

async function loadStatus() {
  const today = todayISO();
  const { data, error } = await db.from('attendance')
    .select('*').eq('employee_id', kasir.id)
    .gte('check_in_at', today + 'T00:00:00')
    .lte('check_in_at', today + 'T23:59:59')
    .order('check_in_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) { $('#status-card').innerHTML = 'Gagal memuat status.'; return; }

  if (!data) {
    openAttendanceId = null;
    $('#status-card').innerHTML = `
      <div class="big">🕐</div>
      Belum absen hari ini.<br><br>
      <button class="btn btn-gold" onclick="startAction('in')">📸 Check-in Sekarang</button>`;
  } else if (!data.check_out_at) {
    openAttendanceId = data.id;
    $('#status-card').innerHTML = `
      <div class="big">✅</div>
      Check-in jam <b>${new Date(data.check_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</b><br><br>
      <button class="btn btn-primary" onclick="startAction('out')">📸 Check-out Sekarang</button>`;
  } else {
    $('#status-card').innerHTML = `
      <div class="big">🎉</div>
      Absensi hari ini selesai.<br>
      Masuk ${new Date(data.check_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ·
      Pulang ${new Date(data.check_out_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  }
}

function startAction(action) {
  pendingAction = action;
  $('#cam-input').click();
}

async function handlePhoto(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file || !pendingAction) return;

  $('#status-card').innerHTML = `<div class="big">⏳</div>Mengunggah foto...`;

  const { data: { user } } = await db.auth.getUser();
  const path = `${user.id}/${Date.now()}.jpg`;
  const { error: upErr } = await db.storage.from('attendance-photos').upload(path, file);
  if (upErr) { alert(upErr.message); loadStatus(); return; }
  const { data: { publicUrl } } = db.storage.from('attendance-photos').getPublicUrl(path);

  if (pendingAction === 'in') {
    const { error } = await db.from('attendance').insert({
      employee_id: kasir.id,
      device_id: kasir.deviceId,
      check_in_photo: publicUrl,
    });
    if (error) return alert(error.message);
    toast('✅ Check-in tersimpan');
  } else {
    const { error } = await db.from('attendance').update({
      check_out_at: new Date().toISOString(),
      check_out_photo: publicUrl,
    }).eq('id', openAttendanceId);
    if (error) return alert(error.message);
    toast('✅ Check-out tersimpan');
  }

  pendingAction = null;
  loadStatus();
  loadToday();
}

async function loadToday() {
  const today = todayISO();
  const { data, error } = await db.from('attendance')
    .select('*, employees(name)')
    .gte('check_in_at', today + 'T00:00:00')
    .lte('check_in_at', today + 'T23:59:59')
    .order('check_in_at', { ascending: false });

  if (error) { $('#today-list').innerHTML = `<div class="empty card">Gagal memuat riwayat.</div>`; return; }
  if (!data?.length) { $('#today-list').innerHTML = `<div class="empty card">Belum ada yang absen hari ini.</div>`; return; }

  $('#today-list').innerHTML = data.map(a => `
    <div class="item" style="cursor:default">
      <div style="display:flex;align-items:center;gap:10px">
        <img src="${a.check_in_photo}" alt="foto" style="width:44px;height:44px;border-radius:10px;object-fit:cover">
        <div>
          <div class="title">${a.employees?.name || '—'}</div>
          <div class="meta">
            Masuk ${new Date(a.check_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            ${a.check_out_at ? ' · Pulang ' + new Date(a.check_out_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ' · Belum pulang'}
          </div>
        </div>
      </div>
    </div>`).join('');
}

init();
