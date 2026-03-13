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

  // Clear field errors on input
  form.querySelectorAll('input, textarea, select').forEach((field) => {
    field.addEventListener('input', () => {
      clearFieldError(field);
    });
  });
};

const handleContactSubmit = async (e) => {
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  // Gather form data
  const data = {
    name: form.querySelector('#contact-name')?.value.trim() || '',
    email: form.querySelector('#contact-email')?.value.trim() || '',
    phone: form.querySelector('#contact-phone')?.value.trim() || '',
    subject: form.querySelector('#contact-subject')?.value.trim() || '',
    message: form.querySelector('#contact-message')?.value.trim() || '',
  };

  // Validate
  const errors = validateContactForm(data);
  if (errors.length > 0) {
    errors.forEach(({ field, message }) => showFieldError(field, message));
    showToast('Please fix the errors in the form', 'error');
    return;
  }

  // Submit
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

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

    showToast('Your message has been sent! We will get back to you soon.', 'success');
    form.reset();
  } catch (err) {
    console.error('Contact form error:', err);
    showToast(err.message || 'Failed to send message. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
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
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'contact-email', message: 'Please enter a valid email address' });
  }

  if (data.phone && !isValidPhone(data.phone)) {
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

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone) => {
  return /^[\d\s\-+()]{7,20}$/.test(phone);
};

const showFieldError = (fieldId, message) => {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.add('is-invalid');

  // Remove existing error message
  const existingErr = field.parentElement.querySelector('.field-error');
  if (existingErr) existingErr.remove();

  const errorEl = document.createElement('div');
  errorEl.className = 'field-error';
  errorEl.textContent = message;
  field.parentElement.appendChild(errorEl);
};

const clearFieldError = (field) => {
  field.classList.remove('is-invalid');
  const errorEl = field.parentElement.querySelector('.field-error');
  if (errorEl) errorEl.remove();
};
