/**
 * PitaCopa — Cookie & LGPD Consent Banner
 * Stores choice in localStorage under 'pitacopa_consent'.
 * Values: 'all' | 'essential'
 * Pages can read this to enable/disable analytics.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'pitacopa_consent';
  var ADSENSE_CLIENT = 'ca-pub-4831931651277615';
  var adsenseLoaded = false;

  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }

  // Only inject the AdSense ad-serving script (which sets advertising/tracking
  // cookies) after the user has explicitly accepted advertising cookies.
  function loadAdsense() {
    if (adsenseLoaded) return;
    adsenseLoaded = true;
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }

  function dismiss(banner) {
    banner.style.transform = 'translateY(110%)';
    banner.style.opacity = '0';
    setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 400);
  }

  function init() {
    var consent = getConsent();

    if (consent) {
      // Returning visitor: honor their previous choice.
      if (consent === 'all') loadAdsense();
      return;
    }

    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-label', 'Aviso de privacidade e cookies');
    banner.innerHTML =
      '<div class="cb-content">' +
        '<div class="cb-text">' +
          '<strong>🍪 Privacidade &amp; Cookies</strong>' +
          '<p>Usamos cookies essenciais para autenticação e preferências de sessão, ' +
          'serviços do Google (Firebase) para login e armazenamento seguro, e cookies de publicidade do ' +
          'Google AdSense para manter o PitaCopa gratuito. ' +
          'Saiba mais na nossa <a href="/privacy">Política de Privacidade</a> e <a href="/cookies">Política de Cookies</a>.</p>' +
        '</div>' +
        '<div class="cb-actions">' +
          '<button id="cb-accept" class="cb-btn cb-btn-primary">Aceitar tudo</button>' +
          '<button id="cb-essential" class="cb-btn cb-btn-ghost">Apenas essenciais</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(banner);

    // Animate in after paint
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('cb-visible');
      });
    });

    document.getElementById('cb-accept').addEventListener('click', function () {
      setConsent('all');
      loadAdsense();
      dismiss(banner);
    });

    document.getElementById('cb-essential').addEventListener('click', function () {
      setConsent('essential');
      dismiss(banner);
    });
  }

  // Expose so pages can check consent level
  window.pitaConsent = { get: getConsent, set: setConsent };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
