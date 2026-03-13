/**
 * Fork n Cork - Product Detail Page JS
 * Fetches a single product and renders its full details with quantity selector.
 */

let selectedQuantity = 1;

document.addEventListener('DOMContentLoaded', () => {
  const productId = new URLSearchParams(window.location.search).get('id');

  if (!productId) {
    showProductError('No product specified. Please go back to the menu.');
    return;
  }

  loadProduct(productId);
});

const loadProduct = async (productId) => {
  const container = document.getElementById('product-detail');
  if (!container) return;

  container.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading product details...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      credentials: 'include',
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Product not found');
    }

    const product = json.data;
    renderProduct(product);
  } catch (err) {
    console.error('Error loading product:', err);
    showProductError(
      'Unable to load product details. The product may no longer be available.'
    );
  }
};

const renderProduct = (product) => {
  const container = document.getElementById('product-detail');
  if (!container) return;

  const imageUrl = product.image_url || '/images/placeholder-food.jpg';

  container.innerHTML = `
    <div class="product-detail-grid">
      <div class="product-detail-image">
        <img src="${imageUrl}" alt="${product.name}" id="product-main-image">
      </div>
      <div class="product-detail-info">
        ${product.category_name ? `<span class="product-detail-category">${product.category_name}</span>` : ''}
        <h1 class="product-detail-title">${product.name}</h1>
        <p class="product-detail-price">${formatPrice(product.price)}</p>

        ${product.description ? `<div class="product-detail-description"><p>${product.description}</p></div>` : ''}

        <div class="product-detail-actions">
          <div class="quantity-selector">
            <button class="qty-btn" id="qty-decrease" aria-label="Decrease quantity">-</button>
            <span class="qty-value" id="qty-display">1</span>
            <button class="qty-btn" id="qty-increase" aria-label="Increase quantity">+</button>
          </div>
          <button
            class="btn btn-primary btn-lg btn-add-to-cart-detail"
            id="add-to-cart-btn"
            data-id="${product.id}"
            data-name="${product.name}"
            data-price="${product.price}"
            data-image="${imageUrl}"
          >
            Add to Cart - ${formatPrice(product.price)}
          </button>
        </div>

        <div class="product-detail-meta">
          ${product.is_featured ? '<span class="badge badge-featured">Featured Dish</span>' : ''}
          ${product.is_available === false ? '<span class="badge badge-unavailable">Currently Unavailable</span>' : ''}
        </div>
      </div>
    </div>
  `;

  selectedQuantity = 1;
  initQuantityControls(product);
  initAddToCartButton(product);
};

const initQuantityControls = (product) => {
  const decreaseBtn = document.getElementById('qty-decrease');
  const increaseBtn = document.getElementById('qty-increase');
  const display = document.getElementById('qty-display');
  const addBtn = document.getElementById('add-to-cart-btn');

  if (!decreaseBtn || !increaseBtn || !display) return;

  const updateDisplay = () => {
    display.textContent = selectedQuantity;
    decreaseBtn.disabled = selectedQuantity <= 1;

    if (addBtn) {
      const total = product.price * selectedQuantity;
      addBtn.textContent = `Add to Cart - ${formatPrice(total)}`;
    }
  };

  decreaseBtn.addEventListener('click', () => {
    if (selectedQuantity > 1) {
      selectedQuantity--;
      updateDisplay();
    }
  });

  increaseBtn.addEventListener('click', () => {
    selectedQuantity++;
    updateDisplay();
  });

  updateDisplay();
};

const initAddToCartButton = (product) => {
  const addBtn = document.getElementById('add-to-cart-btn');
  if (!addBtn) return;

  addBtn.addEventListener('click', (e) => {
    e.preventDefault();

    if (product.is_available === false) {
      showToast('This product is currently unavailable', 'warning');
      return;
    }

    const cartProduct = {
      id: parseInt(product.id, 10),
      name: product.name,
      price: parseFloat(product.price),
      quantity: selectedQuantity,
      image: product.image_url || '/images/placeholder-food.jpg',
    };

    addToCart(cartProduct);

    // Brief visual feedback on the button
    addBtn.textContent = 'Added!';
    addBtn.disabled = true;
    setTimeout(() => {
      addBtn.disabled = false;
      const total = product.price * selectedQuantity;
      addBtn.textContent = `Add to Cart - ${formatPrice(total)}`;
    }, 1000);
  });
};

const showProductError = (message) => {
  const container = document.getElementById('product-detail');
  if (!container) return;

  container.innerHTML = `
    <div class="error-state">
      <h2>Oops!</h2>
      <p>${message}</p>
      <a href="/menu" class="btn btn-primary">Back to Menu</a>
    </div>
  `;
};
