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

  function showBanner(html, onInstallClick) {
    if (document.getElementById('pwa-banner')) return;
    const el = document.createElement('div');
    el.id = 'pwa-banner';
    el.className = 'pwa-banner';
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
