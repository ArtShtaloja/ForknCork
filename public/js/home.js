/**
 * Fork n Cork - Homepage JS
 * Fetches and renders featured products.
 */

document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProducts();
});

const loadFeaturedProducts = async () => {
  const container = document.getElementById('featured-products');
  if (!container) return;

  container.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading featured dishes...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/products/featured`, {
      credentials: 'include',
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load featured products');
    }

    const products = json.data;

    if (!products || products.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No featured dishes at the moment. Check back soon!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(renderFeaturedCard).join('');
    attachAddToCartHandlers(container);
  } catch (err) {
    console.error('Error loading featured products:', err);
    container.innerHTML = `
      <div class="error-state">
        <p>Unable to load featured dishes. Please try again later.</p>
        <button class="btn btn-primary" onclick="loadFeaturedProducts()">Retry</button>
      </div>
    `;
  }
};

const renderFeaturedCard = (product) => {
  const imageUrl = product.image_url
    ? product.image_url
    : '/images/placeholder-food.jpg';

  return `
    <div class="product-card featured-card" data-product-id="${product.id}">
      <div class="product-card-image">
        <img src="${imageUrl}" alt="${product.name}" loading="lazy">
        ${product.is_featured ? '<span class="badge badge-featured">Featured</span>' : ''}
      </div>
      <div class="product-card-body">
        <h3 class="product-card-title">${product.name}</h3>
        <p class="product-card-description">
          ${product.description ? product.description.substring(0, 100) + (product.description.length > 100 ? '...' : '') : ''}
        </p>
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

const attachAddToCartHandlers = (container) => {
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

  // Clicking the card itself navigates to the product detail page
  container.querySelectorAll('.product-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-add-to-cart')) return;
      const productId = card.dataset.productId;
      window.location.href = `/menu/product?id=${productId}`;
    });

    card.style.cursor = 'pointer';
  });
};
