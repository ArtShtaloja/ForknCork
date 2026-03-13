/**
 * Fork n Cork - Homepage JS
 * Fetches and renders featured products.
 */

document.addEventListener('DOMContentLoaded', async () => {
  await ProductImages.load();
  loadFeaturedProducts();
});

const loadFeaturedProducts = async () => {
  const container = document.getElementById('featured-products');
  if (!container) return;

  container.innerHTML = '<div class="spinner"></div>';

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
      container.innerHTML = '<div class="no-products"><p>No featured dishes at the moment.</p></div>';
      return;
    }

    container.innerHTML = products.map(renderFeaturedCard).join('');
    attachAddToCartHandlers(container);
  } catch (err) {
    console.error('Error loading featured products:', err);
    container.innerHTML = `
      <div class="no-products">
        <p>Unable to load featured dishes.</p>
        <button class="btn btn-primary btn-sm" onclick="loadFeaturedProducts()">Retry</button>
      </div>
    `;
  }
};

const renderFeaturedCard = (product) => {
  const imageUrl = ProductImages.resolve(product);

  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-card-img">
        <img src="${imageUrl}" alt="${product.name}" loading="lazy">
        ${product.is_featured ? '<span class="product-card-badge">Featured</span>' : ''}
      </div>
      <div class="product-card-body">
        ${product.category_name ? `<span class="product-card-category">${product.category_name}</span>` : ''}
        <h3 class="product-card-name">${product.name}</h3>
        <p class="product-card-desc">${product.description ? product.description.substring(0, 100) : ''}</p>
        <div class="product-card-footer">
          <span class="product-card-price"><span class="currency">&euro;</span>${parseFloat(product.price).toFixed(2)}</span>
          <button
            class="add-cart-btn"
            data-id="${product.id}"
            data-name="${product.name}"
            data-price="${product.price}"
            data-image="${imageUrl}"
            aria-label="Add to cart"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
};

const attachAddToCartHandlers = (container) => {
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

  container.querySelectorAll('.product-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.add-cart-btn')) return;
      const productId = card.dataset.productId;
      window.location.href = `/menu/product?id=${productId}`;
    });
  });
};
