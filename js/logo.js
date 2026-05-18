// ── BolãoCopa Logo — SVG component ──────────────────────
// Inject the logo into every element with class="app-logo"
// and optionally data-size="sm|md|lg"

const LOGO_SVG = `
<svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="BolãoCopa logo">
  <defs>
    <linearGradient id="logo-fill" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#f87171"/>
      <stop offset="100%" stop-color="#b91c1c"/>
    </linearGradient>
    <linearGradient id="logo-shine" x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <!-- Background squircle -->
  <rect width="44" height="44" rx="12" fill="url(#logo-fill)"/>
  <!-- Shine overlay -->
  <rect width="44" height="44" rx="12" fill="url(#logo-shine)"/>
  <!-- Football hexagonal panel (outer ring) -->
  <circle cx="22" cy="21" r="13" stroke="rgba(255,255,255,0.22)" stroke-width="1.5" fill="none"/>
  <!-- Central pentagon (main patch) -->
  <polygon points="22,10 28.9,14.5 26.4,22.5 17.6,22.5 15.1,14.5"
    fill="white" opacity="0.96"/>
  <!-- Side patches -->
  <polygon points="15.1,14.5 9,17 9.5,24.5 15,27 17.6,22.5"
    fill="rgba(255,255,255,0.38)"/>
  <polygon points="28.9,14.5 35,17 34.5,24.5 29,27 26.4,22.5"
    fill="rgba(255,255,255,0.38)"/>
  <!-- Bottom patches -->
  <polygon points="17.6,22.5 15,27 18,32 22,32.5 26,32 29,27 26.4,22.5"
    fill="rgba(255,255,255,0.55)"/>
  <!-- Base / stem -->
  <rect x="17" y="33" width="10" height="2" rx="1" fill="rgba(255,255,255,0.7)"/>
  <rect x="15" y="35" width="14" height="2.5" rx="1.25" fill="rgba(255,255,255,0.55)"/>
</svg>`;

function injectLogos() {
  document.querySelectorAll('.app-logo').forEach(el => {
    const size = el.dataset.size === 'sm' ? 28 : el.dataset.size === 'lg' ? 48 : 36;
    el.style.width  = size + 'px';
    el.style.height = size + 'px';
    el.style.display = 'inline-block';
    el.style.flexShrink = '0';
    el.innerHTML = LOGO_SVG;
    el.querySelector('svg').setAttribute('width', size);
    el.querySelector('svg').setAttribute('height', size);
  });
}

document.addEventListener('DOMContentLoaded', injectLogos);
