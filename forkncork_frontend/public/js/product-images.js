/**
 * Fork n Cork – Product Image Resolver
 * Maps product names to local images in /images/menu/.
 * Shared across home.js, menu.js, and product.js.
 */

const ProductImages = (() => {
  const FALLBACK_IMAGES = [
    '/images/forkncork1.jpg', '/images/forkncork2.jpg', '/images/forkncork3.jpg',
    '/images/forkncork4.jpg', '/images/forkncork5.jpg', '/images/forkncork6.jpg',
    '/images/forkncork7.jpg', '/images/forkncork8.jpg', '/images/forkncork9.jpg',
    '/images/forkncork10.jpg',
  ];

  /**
   * No-op — kept for backward compatibility with callers.
   */
  function load() {
    return Promise.resolve();
  }

  /**
   * Convert a product name to a local image filename.
   * "BBQ Bacon Burger" → "bbq-bacon-burger.jpg"
   */
  function nameToFilename(name) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      + '.jpg';
  }

  /**
   * Resolve the best image URL for a product.
   *
   * Priority:
   *  1. Backend image_url (admin upload or absolute URL) — but fix legacy /images/products/ paths
   *  2. Local image derived from product name
   *  3. Deterministic fallback
   */
  function resolve(product) {
    // If backend provides image_url, normalise legacy /images/products/ → /images/menu/
    if (product.image_url) {
      return product.image_url.replace('/images/products/', '/images/menu/');
    }

    const productName = (product.name || '').trim();
    if (productName) {
      return '/images/menu/' + nameToFilename(productName);
    }

    return FALLBACK_IMAGES[(product.id || 0) % FALLBACK_IMAGES.length];
  }

  return { load, resolve };
})();
