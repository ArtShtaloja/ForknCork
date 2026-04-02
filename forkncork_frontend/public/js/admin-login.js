/**
 * Fork n Cork - Admin Login Page JS
 * Handles login form submission and authentication.
 */

document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
});

const initLoginForm = () => {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', handleLoginSubmit);

  // Clear errors on input
  form.querySelectorAll('input').forEach((field) => {
    field.addEventListener('input', () => {
      field.classList.remove('is-invalid');
      const err = field.parentElement.querySelector('.field-error');
      if (err) err.remove();
      const alert = document.getElementById('login-error');
      if (alert) alert.style.display = 'none';
    });
  });
};

const handleLoginSubmit = async (e) => {
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorAlert = document.getElementById('login-error');

  const email = form.querySelector('#login-email')?.value.trim() || '';
  const password = form.querySelector('#login-password')?.value || '';

  // Validate
  let hasError = false;

  if (!email) {
    showLoginFieldError('login-email', I18n.t('admin.login.emailRequired'));
    hasError = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showLoginFieldError('login-email', I18n.t('admin.login.emailInvalid'));
    hasError = true;
  }

  if (!password) {
    showLoginFieldError('login-password', I18n.t('admin.login.passwordRequired'));
    hasError = true;
  }

  if (hasError) return;

  submitBtn.disabled = true;
  submitBtn.textContent = I18n.t('admin.login.signingIn');
  if (errorAlert) errorAlert.style.display = 'none';

  try {
    // Build API base the same way as app.js / admin.js
    const apiBase = (typeof BACKEND_URL !== 'undefined' && BACKEND_URL)
      ? BACKEND_URL.replace(/\/+$/, '') + '/api'
      : '/api';

    const res = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: email, password }),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || I18n.t('admin.login.invalidCredentials'));
    }

    window.location.href = '/admin/dashboard';
  } catch (err) {
    console.error('Login error:', err);
    if (errorAlert) {
      errorAlert.textContent = err.message || I18n.t('admin.login.failed');
      errorAlert.style.display = 'block';
    }
    submitBtn.disabled = false;
    submitBtn.textContent = I18n.t('admin.login.signIn');
  }
};

const showLoginFieldError = (fieldId, message) => {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.add('is-invalid');
  const existingErr = field.parentElement.querySelector('.field-error');
  if (existingErr) existingErr.remove();

  const errorEl = document.createElement('div');
  errorEl.className = 'field-error';
  errorEl.textContent = message;
  field.parentElement.appendChild(errorEl);
};
