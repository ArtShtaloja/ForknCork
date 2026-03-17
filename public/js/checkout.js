/**
 * Fork n Cork - Checkout JS
 * Renders order summary from cart, handles order submission.
 */

document.addEventListener('DOMContentLoaded', () => {
  renderOrderSummary();
  initCheckoutForm();
  initCheckoutModal();
});

// ---------------------------------------------------------------------------
// Checkout modal open/close
// ---------------------------------------------------------------------------

const initCheckoutModal = () => {
  const overlay = document.getElementById('checkout-overlay');
  const closeBtn = document.getElementById('checkout-close');
  if (!overlay) return;

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
    });
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      overlay.classList.remove('open');
    }
  });

  // Show/hide address field based on order type
  const orderType = document.getElementById('checkout-order-type');
  const addressGroup = document.getElementById('checkout-address-group');
  if (orderType && addressGroup) {
    orderType.addEventListener('change', () => {
      addressGroup.style.display = orderType.value === 'delivery' ? 'block' : 'none';
    });
  }
};

// ---------------------------------------------------------------------------
// Order summary
// ---------------------------------------------------------------------------

const renderOrderSummary = () => {
  const container = document.getElementById('checkout-summary');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="no-products" style="padding:1rem 0">
        <p>Your cart is empty.</p>
        <a href="/menu" class="btn btn-primary btn-sm">Browse Menu</a>
      </div>
    `;
    const form = document.getElementById('checkout-form');
    if (form) form.style.display = 'none';
    return;
  }

  const form = document.getElementById('checkout-form');
  if (form) form.style.display = 'block';

  container.innerHTML = `
    <table class="order-summary">
      <thead>
        <tr>
          <th>${typeof I18n !== 'undefined' ? I18n.t('checkout.item') : 'Item'}</th>
          <th>${typeof I18n !== 'undefined' ? I18n.t('checkout.qty') : 'Qty'}</th>
          <th>${typeof I18n !== 'undefined' ? I18n.t('checkout.price') : 'Price'}</th>
        </tr>
      </thead>
      <tbody>
        ${cart
          .map(
            (item) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${formatPrice(item.price * item.quantity)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2">${typeof I18n !== 'undefined' ? I18n.t('checkout.total') : 'Total'}</td>
          <td>${formatPrice(getCartTotal())}</td>
        </tr>
      </tfoot>
    </table>
  `;
};

// ---------------------------------------------------------------------------
// Checkout form
// ---------------------------------------------------------------------------

const initCheckoutForm = () => {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', handleCheckoutSubmit);

  form.querySelectorAll('input, textarea, select').forEach((field) => {
    field.addEventListener('input', () => {
      const group = field.closest('.form-group');
      if (group) group.classList.remove('error');
    });
  });
};

const handleCheckoutSubmit = async (e) => {
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const cart = getCart();

  if (cart.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }

  const formData = {
    customer_name: form.querySelector('#checkout-name')?.value.trim() || '',
    customer_email: form.querySelector('#checkout-email')?.value.trim() || '',
    customer_phone: form.querySelector('#checkout-phone')?.value.trim() || '',
    customer_address: form.querySelector('#checkout-address')?.value.trim() || '',
    order_type: form.querySelector('#checkout-order-type')?.value || 'delivery',
    notes: form.querySelector('#checkout-notes')?.value.trim() || '',
  };

  const errors = validateCheckoutForm(formData);
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
    showToast('Please fix the errors in the form', 'error');
    return;
  }

  const orderPayload = {
    ...formData,
    items: cart.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
    })),
  };

  submitBtn.disabled = true;
  const placingText = typeof I18n !== 'undefined' ? I18n.t('checkout.placing') : 'Placing Order...';
  submitBtn.textContent = placingText;

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(orderPayload),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to place order');
    }

    const order = json.data;
    clearCart();
    showOrderConfirmation(order);
  } catch (err) {
    console.error('Checkout error:', err);
    showToast(I18n.t('checkout.error'), 'error');
    submitBtn.disabled = false;
    const placeText = typeof I18n !== 'undefined' ? I18n.t('checkout.placeOrder') : 'Place Order';
    submitBtn.textContent = placeText;
  }
};

const validateCheckoutForm = (data) => {
  const errors = [];

  if (!data.customer_name) {
    errors.push({ field: 'checkout-name', message: 'Name is required' });
  } else if (data.customer_name.length < 2) {
    errors.push({ field: 'checkout-name', message: 'Name must be at least 2 characters' });
  }

  if (!data.customer_email) {
    errors.push({ field: 'checkout-email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer_email)) {
    errors.push({ field: 'checkout-email', message: 'Please enter a valid email' });
  }

  if (!data.customer_phone) {
    errors.push({ field: 'checkout-phone', message: 'Phone number is required' });
  } else if (!/^[\d\s\-+()]{7,20}$/.test(data.customer_phone)) {
    errors.push({ field: 'checkout-phone', message: 'Please enter a valid phone number' });
  }

  if (data.order_type === 'delivery' && !data.customer_address) {
    errors.push({ field: 'checkout-address', message: 'Delivery address is required' });
  }

  return errors;
};

const showOrderConfirmation = (order) => {
  const modalBody = document.querySelector('#checkout-modal .modal-body');
  if (!modalBody) return;

  const orderNumber = order.order_number || order.id || 'N/A';
  const successTitle = typeof I18n !== 'undefined' ? I18n.t('checkout.successTitle') : 'Order Confirmed!';
  const successMsg = typeof I18n !== 'undefined' ? I18n.t('checkout.successMsg') : 'Your order has been placed successfully.';

  // Update modal content to show success
  modalBody.innerHTML = `
    <div class="text-center py-4">
      <div class="success-icon mb-3" style="font-size:3rem;color:var(--primary)">
        <i class="fas fa-check-circle"></i>
      </div>
      <h2 class="mb-2" data-i18n="checkout.thankYou">${I18n.t('checkout.thankYou')}</h2>
      <p class="text-dim mb-4" data-i18n="checkout.successMsg">${I18n.t('checkout.successMsg')}</p>
      <button class="btn btn-primary" onclick="location.href='/'" data-i18n="admin.login.backToWeb">${I18n.t('admin.login.backToWeb')}</button>
    </div>
  `;

  showToast(I18n.t('checkout.success'), 'success');
};
