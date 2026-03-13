/**
 * Fork n Cork - Menu Page JS
 * Handles category filtering, product search, and cart integration.
 */

let allProducts = [];
let activeCategory = null;

document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  loadProducts();
  initSearch();
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const loadCategories = async () => {
  const container = document.getElementById('category-filters');
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

    container.innerHTML = `
      <button class="filter-btn active" data-category="">All</button>
      ${categories
        .map(
          (cat) => `
        <button class="filter-btn" data-category="${cat.id}">
          ${cat.name}
        </button>
      `
        )
        .join('')}
    `;

    container.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container
          .querySelectorAll('.filter-btn')
          .forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const categoryId = btn.dataset.category;
        activeCategory = categoryId || null;
        loadProducts(activeCategory);
      });
    });
  } catch (err) {
    console.error('Error loading categories:', err);
    container.innerHTML = '<p class="text-muted">Could not load categories.</p>';
  }
};

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const loadProducts = async (categoryId = null) => {
  const container = document.getElementById('product-grid');
  if (!container) return;

  container.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading menu...</p>
    </div>
  `;

  try {
    let url = `${API_BASE}/products`;
    if (categoryId) {
      url += `?category_id=${categoryId}`;
    }

    const res = await fetch(url, { credentials: 'include' });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load products');
    }

    allProducts = json.data || [];

    // Apply any current search filter
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
      <div class="error-state">
        <p>Unable to load menu items. Please try again later.</p>
        <button class="btn btn-primary" onclick="loadProducts()">Retry</button>
      </div>
    `;
  }
};

const renderProducts = (products) => {
  const container = document.getElementById('product-grid');
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No items found. Try a different category or search term.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(renderProductCard).join('');

  // Add to cart handlers
  container.querySelectorAll('.btn-add-to-cart').forEach((btn) => {
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
      if (e.target.closest('.btn-add-to-cart')) return;
      window.location.href = `/menu/product?id=${card.dataset.productId}`;
    });
    card.style.cursor = 'pointer';
  });
};

const renderProductCard = (product) => {
  const imageUrl = product.image_url || '/images/placeholder-food.jpg';

  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-card-image">
        <img src="${imageUrl}" alt="${product.name}" loading="lazy">
        ${product.is_featured ? '<span class="badge badge-featured">Featured</span>' : ''}
      </div>
      <div class="product-card-body">
        <h3 class="product-card-title">${product.name}</h3>
        <p class="product-card-description">
          ${product.description ? product.description.substring(0, 120) + (product.description.length > 120 ? '...' : '') : ''}
        </p>
        ${product.category_name ? `<span class="product-card-category">${product.category_name}</span>` : ''}
        <div class="product-card-footer">
          <span class="product-card-price">${formatPrice(product.price)}</span>
          <button
            class="btn btn-primary btn-add-to-cart"
            data-id="${product.id}"
            data-name="${product.name}"
            data-price="${product.price}"
            data-image="${imageUrl}"
          >
            Add to Cart
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
