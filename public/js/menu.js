/**
 * Fork n Cork - Menu Page JS
 * Handles category filtering, product search, and cart integration.
 */

let allProducts = [];
let activeCategory = null;

document.addEventListener('DOMContentLoaded', async () => {
  await ProductImages.load();
  loadCategories();
  loadProducts();
  initSearch();
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const loadCategories = async () => {
  const container = document.getElementById('category-tabs');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/categories`, {
      credentials: 'include',
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load categories');
    }

    const categories = json.data || [];
    const allLabel = typeof I18n !== 'undefined' ? I18n.t('menu.all') : 'All';

    container.innerHTML = `
      <button class="category-tab active" data-category="">${allLabel}</button>
      ${categories
        .map(
          (cat) => `
        <button class="category-tab" data-category="${cat.id}">${cat.name}</button>
      `
        )
        .join('')}
    `;

    container.querySelectorAll('.category-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.category-tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const categoryId = btn.dataset.category;
        activeCategory = categoryId || null;
        loadProducts(activeCategory);
      });
    });
  } catch (err) {
    console.error('Error loading categories:', err);
  }
};

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const loadProducts = async (categoryId = null) => {
  const container = document.getElementById('products-grid');
  if (!container) return;

  container.innerHTML = '<div class="spinner"></div>';

  try {
    let url = `${API_BASE}/products`;
    if (categoryId) {
      url += `?category_id=${categoryId}`;
    }

    console.log(`[DEBUG] Frontend calling API URL: ${url}`);
    const res = await fetch(url, { credentials: 'include' });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load products');
    }

    allProducts = json.data || [];

    const searchInput = document.getElementById('menu-search');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const filtered = query
      ? allProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        )
      : allProducts;

    renderProducts(filtered);
  } catch (err) {
    console.error('Error loading products:', err);
    container.innerHTML = `
      <div class="no-products">
        <p>Unable to load menu items.</p>
        <button class="btn btn-primary btn-sm" onclick="loadProducts()">Retry</button>
      </div>
    `;
  }
};

const renderProducts = (products) => {
  const container = document.getElementById('products-grid');
  if (!container) return;

  if (products.length === 0) {
    const msg = typeof I18n !== 'undefined' ? I18n.t('menu.noProducts') : 'No products found.';
    container.innerHTML = `<div class="no-products"><p>${msg}</p></div>`;
    return;
  }

  container.innerHTML = products.map(renderProductCard).join('');

  // Add to cart handlers
  container.querySelectorAll('.add-cart-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const product = {
        id: parseInt(btn.dataset.id, 10),
        name: btn.dataset.name,
        price: parseFloat(btn.dataset.price),
        quantity: 1,
        image: btn.dataset.image,
      };

      addToCart(product);
    });
  });

  // Card click navigates to product detail
  container.querySelectorAll('.product-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.add-cart-btn')) return;
      window.location.href = `/menu/product?id=${card.dataset.productId}`;
    });
  });
};

const renderProductCard = (product) => {
  const image = ProductImages.resolve(product);

  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-card-img">
        <img src="${image}" alt="${product.name}" loading="lazy">
        ${product.is_featured ? '<span class="product-card-badge">Featured</span>' : ''}
      </div>
      <div class="product-card-body">
        ${product.category_name ? `<span class="product-card-category">${product.category_name}</span>` : ''}
        <h3 class="product-card-name">${product.name}</h3>
        <p class="product-card-desc">${product.description ? product.description.substring(0, 120) : ''}</p>
        <div class="product-card-footer">
          <span class="product-card-price"><span class="currency">&euro;</span>${parseFloat(product.price).toFixed(2)}</span>
          <button
            class="add-cart-btn"
            data-id="${product.id}"
            data-name="${product.name}"
            data-price="${product.price}"
            data-image="${image}"
            aria-label="Add to cart"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
};

// ---------------------------------------------------------------------------
// Search / filter
// ---------------------------------------------------------------------------

const initSearch = () => {
  const searchInput = document.getElementById('menu-search');
  if (!searchInput) return;

  let debounceTimer = null;

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = searchInput.value.trim().toLowerCase();

      if (!query) {
        renderProducts(allProducts);
        return;
      }

      const filtered = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      );

      renderProducts(filtered);
    }, 300);
  });
};
