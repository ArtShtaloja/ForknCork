/**
 * Fork n Cork - Checkout Page JS
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

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
    });
  }

  // Click outside modal to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
    }
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
    }
  });
};

// ---------------------------------------------------------------------------
// Order summary
// ---------------------------------------------------------------------------

const renderOrderSummary = () => {
  const container = document.getElementById('checkout-summary');
  const totalEl = document.getElementById('checkout-total');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Your cart is empty.</p>
        <a href="/menu" class="btn btn-primary">Browse Menu</a>
      </div>
    `;
    // Disable checkout form
    const form = document.getElementById('checkout-form');
    if (form) form.style.display = 'none';
    return;
  }

  container.innerHTML = `
    <table class="order-summary-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${cart
          .map(
            (item) => `
          <tr>
            <td class="order-item-name">
              ${item.image ? `<img src="${item.image}" alt="${item.name}" class="order-item-thumb">` : ''}
              ${item.name}
            </td>
            <td>${item.quantity}</td>
            <td>${formatPrice(item.price)}</td>
            <td>${formatPrice(item.price * item.quantity)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  if (totalEl) {
    totalEl.textContent = formatPrice(getCartTotal());
  }
};

// ---------------------------------------------------------------------------
// Checkout form
// ---------------------------------------------------------------------------

const initCheckoutForm = () => {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', handleCheckoutSubmit);

  // Clear errors on input
  form.querySelectorAll('input, textarea, select').forEach((field) => {
    field.addEventListener('input', () => {
      field.classList.remove('is-invalid');
      const err = field.parentElement.querySelector('.field-error');
      if (err) err.remove();
    });
  });
};

const handleCheckoutSubmit = async (e) => {
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const cart = getCart();

  if (cart.length === 0) {
    showToast('Your cart is empty', 'warning');
    return;
  }

  // Gather form data
  const formData = {
    customer_name: form.querySelector('#checkout-name')?.value.trim() || '',
    customer_email: form.querySelector('#checkout-email')?.value.trim() || '',
    customer_phone: form.querySelector('#checkout-phone')?.value.trim() || '',
    customer_address: form.querySelector('#checkout-address')?.value.trim() || '',
    order_type: form.querySelector('#checkout-order-type')?.value || 'delivery',
    notes: form.querySelector('#checkout-notes')?.value.trim() || '',
  };

  // Validate
  const errors = validateCheckoutForm(formData);
  if (errors.length > 0) {
    errors.forEach(({ field, message }) => {
      const el = document.getElementById(field);
      if (el) {
        el.classList.add('is-invalid');
        const existingErr = el.parentElement.querySelector('.field-error');
        if (existingErr) existingErr.remove();
        const errorEl = document.createElement('div');
        errorEl.className = 'field-error';
        errorEl.textContent = message;
        el.parentElement.appendChild(errorEl);
      }
    });
    showToast('Please fix the errors in the form', 'error');
    return;
  }

  // Build order payload
  const orderPayload = {
    ...formData,
    items: cart.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
    })),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Placing Order...';

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
    showToast(err.message || 'Failed to place order. Please try again.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place Order';
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
    errors.push({ field: 'checkout-email', message: 'Please enter a valid email address' });
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
  const main = document.querySelector('.checkout-container') || document.querySelector('main');
  if (!main) return;

  const orderNumber = order.order_number || order.id || 'N/A';

  main.innerHTML = `
    <div class="order-confirmation">
      <div class="order-confirmation-icon">&#10003;</div>
      <h1>Order Placed Successfully!</h1>
      <p class="order-number">Order #${orderNumber}</p>
      <p>Thank you for your order. We have sent a confirmation to your email.</p>
      <div class="order-confirmation-details">
        <p><strong>Order Type:</strong> ${order.order_type || 'Delivery'}</p>
        <p><strong>Total:</strong> ${formatPrice(order.total_amount || order.total || 0)}</p>
        <p><strong>Status:</strong> ${order.status || 'Pending'}</p>
      </div>
      <div class="order-confirmation-actions">
        <a href="/menu" class="btn btn-primary">Back to Menu</a>
        <a href="/" class="btn btn-secondary">Home</a>
      </div>
    </div>
  `;

  showToast('Order placed successfully!', 'success');
};
