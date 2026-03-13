/* ───────────────────────────────────────────────
   i18n – lightweight translation system
   ─────────────────────────────────────────────── */
const I18n = (() => {
  let translations = {};
  let currentLang = localStorage.getItem('lang') || 'en';

  async function load(lang) {
    try {
      const res = await fetch(`/js/i18n/${lang}.json`);
      if (!res.ok) throw new Error('Failed to load translations');
      translations = await res.json();
      currentLang = lang;
      localStorage.setItem('lang', lang);
      applyTranslations();
      updateToggle();
    } catch (err) {
      console.error('i18n load error:', err);
    }
  }

  function t(key) {
    const keys = key.split('.');
    let val = translations;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        return key;
      }
    }
    return val;
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = t(key);
      if (text !== key) el.textContent = text;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = t(key);
      if (text !== key) el.placeholder = text;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const text = t(key);
      if (text !== key) el.setAttribute('aria-label', text);
    });
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: currentLang } }));
  }

  function updateToggle() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
  }

  function getLang() {
    return currentLang;
  }

  function init() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => load(btn.dataset.lang));
    });
    return load(currentLang);
  }

  return { init, t, getLang, load, applyTranslations };
})();
