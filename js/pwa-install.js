// js/pwa-install.js — Popup ajak install PWA.
// Android/Chrome: pakai prompt instalasi bawaan browser.
// iOS Safari: tidak didukung browser (tidak ada beforeinstallprompt),
// jadi dikasih instruksi manual "Share -> Add to Home Screen".
(function () {
  const DISMISS_KEY = 'bc_pwa_install_dismissed_at';
  const DISMISS_DAYS = 7;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }
  function recentlyDismissed() {
    const t = localStorage.getItem(DISMISS_KEY);
    return t && (Date.now() - Number(t)) < DISMISS_DAYS * 86400000;
  }
  function isIOS() {
    return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  }

  if (isStandalone() || recentlyDismissed()) return;

  // CSS di-inject langsung dari JS (bukan bergantung ke css/style.css) supaya
  // popup ini tidak pernah tampil berantakan walau file CSS terlambat ke-deploy.
  function injectStyle() {
    if (document.getElementById('pwa-banner-style')) return;
    const s = document.createElement('style');
    s.id = 'pwa-banner-style';
    s.textContent = `
      #pwa-banner{position:fixed;left:12px;right:12px;bottom:76px;max-width:420px;
        margin:0 auto;background:#fff;border-radius:14px;padding:12px 14px;
        box-shadow:0 6px 20px rgba(0,0,0,.18);display:flex;align-items:center;
        gap:10px;z-index:99999;font-family:system-ui,-apple-system,sans-serif;
        box-sizing:border-box;}
      #pwa-banner img{width:40px;height:40px;border-radius:10px;flex-shrink:0;
        object-fit:cover;display:block;}
      #pwa-banner .pwa-text{flex:1;font-size:.82rem;line-height:1.35;color:#222;min-width:0;}
      #pwa-banner .pwa-text b{display:block;font-size:.88rem;margin-bottom:2px;}
      #pwa-banner .pwa-install-btn{background:#c9a227;color:#1a1a2e;border:0;
        border-radius:8px;padding:8px 14px;font-weight:700;font-size:.8rem;
        cursor:pointer;white-space:nowrap;flex-shrink:0;}
      #pwa-banner .pwa-close{background:none;border:0;font-size:1rem;color:#777;
        cursor:pointer;padding:4px;flex-shrink:0;line-height:1;}
      @media (min-width:768px){#pwa-banner{left:auto;right:24px;bottom:24px;margin:0;}}
    `;
    document.head.appendChild(s);
  }

  function showBanner(html, onInstallClick) {
    if (document.getElementById('pwa-banner')) return;
    injectStyle();
    const el = document.createElement('div');
    el.id = 'pwa-banner';
    el.innerHTML = html;
    document.body.appendChild(el);
    el.querySelector('.pwa-close').onclick = () => {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      el.remove();
    };
    const btn = el.querySelector('.pwa-install-btn');
    if (btn && onInstallClick) btn.onclick = onInstallClick;
  }

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showBanner(`
      <img src="icons/icon-192.png" alt="">
      <div class="pwa-text"><b>Install CukurRapi</b><br>Akses lebih cepat langsung dari layar HP.</div>
      <button class="pwa-install-btn">Install</button>
      <button class="pwa-close">✕</button>
    `, async () => {
      document.getElementById('pwa-banner')?.remove();
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    });
  });

  if (isIOS()) {
    setTimeout(() => {
      showBanner(`
        <img src="icons/icon-192.png" alt="">
        <div class="pwa-text"><b>Install CukurRapi</b><br>Tap tombol Share (⬆️) di Safari, lalu pilih <b>"Add to Home Screen"</b>.</div>
        <button class="pwa-close">✕</button>
      `);
    }, 1500);
  }
})();
