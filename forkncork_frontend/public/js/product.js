/**
 * Fork n Cork - Product Detail Page JS
 * Fetches a single product and renders its full details with quantity selector.
 */

let selectedQuantity = 1;

document.addEventListener('DOMContentLoaded', async () => {
  await ProductImages.load();
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

  container.innerHTML = '<div class="spinner"></div>';

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
    showProductError('Unable to load product details.');
  }
};

const renderProduct = (product) => {
  const container = document.getElementById('product-detail');
  if (!container) return;

  const imageUrl = ProductImages.resolve(product);

  // Update page title and breadcrumb
  document.title = `${product.name} - Fork n Cork`;
  const breadcrumb = document.getElementById('product-breadcrumb');
  if (breadcrumb) breadcrumb.textContent = product.name;
  const titleBanner = document.getElementById('product-title-banner');
  if (titleBanner) titleBanner.textContent = product.name;

  container.innerHTML = `
    <div class="product-detail-img">
      <img src="${imageUrl}" alt="${product.name}">
    </div>
    <div class="product-detail-info">
      ${product.category_name ? `<span class="product-detail-category">${product.category_name}</span>` : ''}
      <h1 class="product-detail-name">${product.name}</h1>
      ${product.description ? `<p class="product-detail-desc">${product.description}</p>` : ''}
      <div class="product-detail-price" id="product-price">${formatPrice(product.price)}</div>

      <div class="product-detail-actions">
        <div class="quantity-selector">
          <button id="qty-decrease" aria-label="Decrease quantity">-</button>
          <span class="qty-display" id="qty-display">1</span>
          <button id="qty-increase" aria-label="Increase quantity">+</button>
        </div>
        <button
          class="btn btn-primary btn-lg"
          id="add-to-cart-btn"
          data-id="${product.id}"
          data-name="${product.name}"
          data-price="${product.price}"
          data-image="${imageUrl}"
        >
          ${typeof I18n !== 'undefined' ? I18n.t('product.addToCart') : 'Add to Cart'} - ${formatPrice(product.price)}
        </button>
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
      const label = typeof I18n !== 'undefined' ? I18n.t('product.addToCart') : 'Add to Cart';
      addBtn.textContent = `${label} - ${formatPrice(total)}`;
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
      showToast(I18n.t('product.unavailable'), 'warning');
      return;
    }

    const cartProduct = {
      id: parseInt(product.id, 10),
      name: product.name,
      price: parseFloat(product.price),
      quantity: selectedQuantity,
      image: ProductImages.resolve(product),
    };

    addToCart(cartProduct);

    const label = typeof I18n !== 'undefined' ? I18n.t('product.added') : 'Added!';
    addBtn.textContent = label;
    addBtn.disabled = true;
    setTimeout(() => {
      addBtn.disabled = false;
      const total = product.price * selectedQuantity;
      const addLabel = typeof I18n !== 'undefined' ? I18n.t('product.addToCart') : 'Add to Cart';
      addBtn.textContent = `${addLabel} - ${formatPrice(total)}`;
    }, 1000);
  });
};

const showProductError = (message) => {
  const container = document.getElementById('product-detail');
  if (!container) return;

  container.innerHTML = `
    <div class="no-products" style="grid-column:1/-1">
      <p>${message}</p>
      <a href="/menu" class="btn btn-primary btn-sm">Back to Menu</a>
    </div>
  `;
};
