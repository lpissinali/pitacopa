// =============================================
// Utils — Bolão Copa 2026
// =============================================

// Generate a random invite code (6 chars alphanumeric)
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Show toast notification
function showToast(message, type = 'info', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: '⚽' };
  toast.innerHTML = `<span>${icons[type] || '📢'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Copy text to clipboard
async function copyToClipboard(text, successMsg = 'Copiado!') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg, 'success');
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast(successMsg, 'success');
  }
}

// Format date for display
function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
}

// Get current user display name initials
function getInitials(name) {
  return (name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

// Avatar placeholder
function avatarHtml(name, photoURL, size = 36) {
  if (photoURL) {
    return `<img src="${photoURL}" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;">`;
  }
  const initials = getInitials(name);
  const colors = ['#c8102e','#1a1a2e','#00843d','#0f3460','#f4c400'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:${size * 0.38}px;font-weight:700;">${initials}</div>`;
}

// Redirect if not logged in
function requireAuth(auth) {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      if (!user) {
        window.location.href = 'login.html';
      } else {
        resolve(user);
      }
    });
  });
}

// Get URL params
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Mobile menu toggle
function initMobileMenu() {
  const toggle = document.querySelector('.navbar-toggle');
  const nav = document.querySelector('.navbar-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });
    // Close menu when a nav link is clicked
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

// Smooth scroll for anchor links
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// Update navbar auth state
function updateNavAuth(user) {
  document.querySelectorAll('.nav-auth-show').forEach(el => {
    el.classList.toggle('hidden', !user);
  });
  document.querySelectorAll('.nav-guest-show').forEach(el => {
    el.classList.toggle('hidden', !!user);
  });
  if (user) {
    document.querySelectorAll('.nav-user-name').forEach(el => {
      el.textContent = user.displayName || user.email;
    });
  }
}

// Debounce
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
