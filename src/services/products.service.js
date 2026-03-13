const productsRepository = require('../repositories/products.repository.js');

/**
 * Get all products with optional filters and pagination.
 * @param {object} filters - { category_id, is_available, search, page, limit }
 * @returns {Promise<{ products: Array, total: number }>}
 */
const getAll = async (filters = {}) => {
  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const repoFilters = {
    ...filters,
    limit,
    offset,
  };

  const [products, total] = await Promise.all([
    productsRepository.findAll(repoFilters),
    productsRepository.count(repoFilters),
  ]);

  return { products, total, page, limit };
};

/**
 * Get a single product by ID (with images).
 * @param {number} id
 * @returns {Promise<object>}
 * @throws {Error} If not found
 */
const getById = async (id) => {
  const product = await productsRepository.findById(id);

  if (!product) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }

  product.images = await productsRepository.findImages(id);
  return product;
};

/**
 * Get products by category ID.
 * @param {number} categoryId
 * @returns {Promise<Array>}
 */
const getByCategory = async (categoryId) => {
  return productsRepository.findByCategory(categoryId);
};

/**
 * Get featured products.
 * @returns {Promise<Array>}
 */
const getFeatured = async () => {
  return productsRepository.findFeatured();
};

/**
 * Create a new product.
 * @param {object} data
 * @returns {Promise<object>} The newly created product
 */
const create = async (data) => {
  if (!data.slug) {
    data.slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Check slug uniqueness
  const existing = await productsRepository.findBySlug(data.slug);
  if (existing) {
    throw Object.assign(new Error('A product with this slug already exists'), { statusCode: 409 });
  }

  const id = await productsRepository.create(data);
  return productsRepository.findById(id);
};

/**
 * Update an existing product.
 * @param {number} id
 * @param {object} data
 * @returns {Promise<object>} The updated product
 */
const update = async (id, data) => {
  const product = await productsRepository.findById(id);

  if (!product) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }

  if (data.name && !data.slug) {
    data.slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  if (data.slug) {
    const existing = await productsRepository.findBySlug(data.slug);
    if (existing && existing.id !== id) {
      throw Object.assign(new Error('A product with this slug already exists'), { statusCode: 409 });
    }
  }

  await productsRepository.update(id, data);
  return productsRepository.findById(id);
};

/**
 * Delete a product by ID.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const product = await productsRepository.findById(id);

  if (!product) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }

  return productsRepository.delete(id);
};

/**
 * Add an image to a product.
 * @param {number} productId
 * @param {string} imagePath
 * @param {number} isPrimary - 1 or 0
 * @returns {Promise<number>} The new image ID
 */
const addImage = async (productId, imagePath, isPrimary = 0) => {
  const product = await productsRepository.findById(productId);

  if (!product) {
    throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  }

  return productsRepository.addImage(productId, imagePath, isPrimary);
};

/**
 * Delete a product image.
 * @param {number} imageId
 * @returns {Promise<boolean>}
 */
const deleteImage = async (imageId) => {
  const deleted = await productsRepository.deleteImage(imageId);

  if (!deleted) {
    throw Object.assign(new Error('Image not found'), { statusCode: 404 });
  }

  return deleted;
};

/**
 * Get all images for a product.
 * @param {number} productId
 * @returns {Promise<Array>}
 */
const getImages = async (productId) => {
  return productsRepository.findImages(productId);
};

module.exports = {
  getAll,
  getById,
  getByCategory,
  getFeatured,
  create,
  update,
  delete: remove,
  addImage,
  deleteImage,
  getImages,
};
