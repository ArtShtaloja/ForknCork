/**
 * Fork n Cork - Main Application JS
 * Loaded on all public pages. Provides cart management, toasts, and shared utilities.
 */

const API_BASE = '/api';

// ---------------------------------------------------------------------------
// Price formatting
// ---------------------------------------------------------------------------

const formatPrice = (amount) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `\u20AC${num.toFixed(2)}`;
};

// ---------------------------------------------------------------------------
// Toast notifications
// ---------------------------------------------------------------------------

const showToast = (message, type = 'success') => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <p>${message}</p>
    <button class="toast-close" aria-label="Close">&times;</button>
  `;

  container.appendChild(toast);

  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());

  setTimeout(() => {
    toast.style.animation = 'toastIn .3s var(--ease) reverse forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
};

// ---------------------------------------------------------------------------
// Cart management (localStorage)
// ---------------------------------------------------------------------------

const CART_KEY = 'forkncork_cart';

const getCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
};

const saveCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

const addToCart = (product) => {
  const cart = getCart();
  const idx = cart.findIndex((item) => item.id === product.id);

  if (idx !== -1) {
    cart[idx].quantity += product.quantity || 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      quantity: product.quantity || 1,
      image: product.image || null,
    });
  }

  saveCart(cart);
  updateCartBadge();
  renderCart();
  showToast(`${product.name} added to cart`, 'success');
};

const removeFromCart = (productId) => {
  const cart = getCart().filter((item) => item.id !== productId);
  saveCart(cart);
  updateCartBadge();
  renderCart();
};

const updateQuantity = (productId, quantity) => {
  const cart = getCart();
  const idx = cart.findIndex((item) => item.id === productId);

  if (idx !== -1) {
    if (quantity <= 0) {
      cart.splice(idx, 1);
    } else {
      cart[idx].quantity = quantity;
    }
  }

  saveCart(cart);
  updateCartBadge();
  renderCart();
};

const getCartTotal = () => {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
};

const getCartCount = () => {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
};

const clearCart = () => {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
  renderCart();
};

// ---------------------------------------------------------------------------
// Cart badge
// ---------------------------------------------------------------------------

const updateCartBadge = () => {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;

  const count = getCartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
};

// ---------------------------------------------------------------------------
// Cart sidebar
// ---------------------------------------------------------------------------

const toggleCartSidebar = () => {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  if (!sidebar) return;

  const isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  } else {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCart();
  }
};

const renderCart = () => {
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;margin-bottom:1rem;opacity:.3">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <p>${typeof I18n !== 'undefined' ? I18n.t('cart.empty') : 'Your cart is empty'}</p>
        <p class="cart-empty-desc">${typeof I18n !== 'undefined' ? I18n.t('cart.emptyDesc') : 'Add some delicious items from our menu!'}</p>
        <a href="/menu" class="btn btn-primary btn-sm">${typeof I18n !== 'undefined' ? I18n.t('cart.browseMenu') : 'Browse Menu'}</a>
      </div>
    `;
    if (totalEl) totalEl.textContent = formatPrice(0);
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  if (checkoutBtn) checkoutBtn.disabled = false;

  container.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-img">
        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : ''}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn qty-decrease" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn qty-increase" data-id="${item.id}">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-id="${item.id}" aria-label="Remove">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `
    )
    .join('');

  if (totalEl) totalEl.textContent = formatPrice(getCartTotal());

  // Quantity buttons
  container.querySelectorAll('.qty-decrease').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const item = getCart().find((i) => i.id === id);
      if (item) updateQuantity(id, item.quantity - 1);
    });
  });

  container.querySelectorAll('.qty-increase').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const item = getCart().find((i) => i.id === id);
      if (item) updateQuantity(id, item.quantity + 1);
    });
  });

  container.querySelectorAll('.cart-item-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      removeFromCart(id);
    });
  });
};

// ---------------------------------------------------------------------------
// Initialise on page load
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();

  // Cart toggle button
  const cartToggle = document.getElementById('cart-toggle');
  if (cartToggle) {
    cartToggle.addEventListener('click', (e) => {
      e.preventDefault();
      toggleCartSidebar();
    });
  }

  // Cart overlay click to close
  const overlay = document.getElementById('cart-overlay');
  if (overlay) {
    overlay.addEventListener('click', toggleCartSidebar);
  }

  // Cart close button
  const closeBtn = document.getElementById('cart-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', toggleCartSidebar);
  }

  // Checkout button in sidebar - open checkout modal
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const checkoutOverlay = document.getElementById('checkout-overlay');
      if (checkoutOverlay) {
        checkoutOverlay.classList.add('open');
        toggleCartSidebar();
        if (typeof renderOrderSummary === 'function') {
          renderOrderSummary();
        }
      }
    });
  }
});
