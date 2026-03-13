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
  const existing = document.querySelectorAll('.toast-notification');
  existing.forEach((t) => t.remove());

  const colorMap = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
  };

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    padding: 14px 24px; border-radius: 8px; color: #fff;
    background: ${colorMap[type] || colorMap.success};
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-size: 0.95rem; max-width: 380px;
    animation: toastSlideIn 0.3s ease forwards;
  `;
  toast.textContent = message;

  if (!document.getElementById('toast-keyframes')) {
    const style = document.createElement('style');
    style.id = 'toast-keyframes';
    style.textContent = `
      @keyframes toastSlideIn {
        from { opacity: 0; transform: translateX(40px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes toastSlideOut {
        from { opacity: 1; transform: translateX(0); }
        to   { opacity: 0; transform: translateX(40px); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s ease forwards';
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
  const badge = document.querySelector('.cart-badge');
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
  const emptyMsg = document.getElementById('cart-empty');
  const checkoutBtn = document.getElementById('checkout-btn');

  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = '';
    if (emptyMsg) emptyMsg.style.display = 'block';
    if (totalEl) totalEl.textContent = formatPrice(0);
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';
  if (checkoutBtn) checkoutBtn.style.display = 'block';

  container.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-image">
        ${
          item.image
            ? `<img src="${item.image}" alt="${item.name}">`
            : '<div class="cart-item-placeholder"></div>'
        }
      </div>
      <div class="cart-item-details">
        <h4 class="cart-item-name">${item.name}</h4>
        <p class="cart-item-price">${formatPrice(item.price)}</p>
        <div class="cart-item-quantity">
          <button class="qty-btn qty-decrease" data-id="${item.id}">-</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn qty-increase" data-id="${item.id}">+</button>
        </div>
      </div>
      <div class="cart-item-actions">
        <span class="cart-item-subtotal">${formatPrice(item.price * item.quantity)}</span>
        <button class="cart-item-remove" data-id="${item.id}">&times;</button>
      </div>
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
// Mobile menu toggle
// ---------------------------------------------------------------------------

const initMobileMenu = () => {
  const toggle = document.getElementById('mobile-menu-toggle');
  const nav = document.getElementById('nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    toggle.classList.toggle('active');
  });

  // Close menu when a link is clicked
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.classList.remove('active');
    });
  });
};

// ---------------------------------------------------------------------------
// Initialise on page load
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initMobileMenu();

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

  // Clear cart button
  const clearBtn = document.getElementById('cart-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearCart();
      showToast('Cart cleared', 'info');
    });
  }

  // Checkout button in sidebar - open checkout modal
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const overlay = document.getElementById('checkout-overlay');
      if (overlay) {
        overlay.classList.add('active');
        toggleCartSidebar(); // close cart sidebar
        if (typeof renderOrderSummary === 'function') {
          renderOrderSummary();
        }
      }
    });
  }
});
