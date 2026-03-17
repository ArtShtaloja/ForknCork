/**
 * Fork n Cork - Contact Page JS
 * Handles contact form validation and submission.
 */

document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
});

const initContactForm = () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', handleContactSubmit);

  form.querySelectorAll('input, textarea, select').forEach((field) => {
    field.addEventListener('input', () => {
      const group = field.closest('.form-group');
      if (group) group.classList.remove('error');
    });
  });
};

const handleContactSubmit = async (e) => {
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const data = {
    name: form.querySelector('#contact-name')?.value.trim() || '',
    email: form.querySelector('#contact-email')?.value.trim() || '',
    phone: form.querySelector('#contact-phone')?.value.trim() || '',
    subject: form.querySelector('#contact-subject')?.value.trim() || '',
    message: form.querySelector('#contact-message')?.value.trim() || '',
  };

  const errors = validateContactForm(data);
  if (errors.length > 0) {
    errors.forEach(({ field, message }) => {
      const el = document.getElementById(field);
      if (el) {
        const group = el.closest('.form-group');
        if (group) {
          group.classList.add('error');
          const errEl = group.querySelector('.form-error');
          if (errEl) errEl.textContent = message;
        }
      }
    });
    showToast(I18n.t('contact.fixErrors'), 'error');
    return;
  }

  submitBtn.disabled = true;
  const sendingText = typeof I18n !== 'undefined' ? I18n.t('contact.sending') : 'Sending...';
  submitBtn.textContent = sendingText;

  try {
    const res = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to send message');
    }

    showToast(
      typeof I18n !== 'undefined' ? I18n.t('contact.successMsg') : 'Message sent successfully!',
      'success'
    );
    form.reset();
  } catch (err) {
    console.error('Contact form error:', err);
    showToast(err.message || I18n.t('contact.error'), 'error');
  } finally {
    submitBtn.disabled = false;
    const sendText = typeof I18n !== 'undefined' ? I18n.t('contact.send') : 'Send Message';
    submitBtn.textContent = sendText;
  }
};

const validateContactForm = (data) => {
  const errors = [];

  if (!data.name) {
    errors.push({ field: 'contact-name', message: 'Name is required' });
  } else if (data.name.length < 2) {
    errors.push({ field: 'contact-name', message: 'Name must be at least 2 characters' });
  }

  if (!data.email) {
    errors.push({ field: 'contact-email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'contact-email', message: 'Please enter a valid email' });
  }

  if (data.phone && !/^[\d\s\-+()]{7,20}$/.test(data.phone)) {
    errors.push({ field: 'contact-phone', message: 'Please enter a valid phone number' });
  }

  if (!data.subject) {
    errors.push({ field: 'contact-subject', message: 'Subject is required' });
  }

  if (!data.message) {
    errors.push({ field: 'contact-message', message: 'Message is required' });
  } else if (data.message.length < 10) {
    errors.push({ field: 'contact-message', message: 'Message must be at least 10 characters' });
  }

  return errors;
};
