const categoriesRepository = require('../repositories/categories.repository.js');

/**
 * Get all categories.
 * @returns {Promise<Array>}
 */
const getAll = async () => {
  return categoriesRepository.findAll();
};

/**
 * Get a single category by ID.
 * @param {number} id
 * @returns {Promise<object>}
 * @throws {Error} If not found
 */
const getById = async (id) => {
  const category = await categoriesRepository.findById(id);

  if (!category) {
    throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  }

  return category;
};

/**
 * Get only active categories.
 * @returns {Promise<Array>}
 */
const getActive = async () => {
  return categoriesRepository.findActive();
};

/**
 * Create a new category.
 * @param {object} data
 * @returns {Promise<object>} The newly created category
 */
const create = async (data) => {
  // Generate slug from name if not provided
  if (!data.slug) {
    data.slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Check for duplicate slug
  const existing = await categoriesRepository.findBySlug(data.slug);
  if (existing) {
    throw Object.assign(new Error('A category with this slug already exists'), { statusCode: 409 });
  }

  const id = await categoriesRepository.create(data);
  return categoriesRepository.findById(id);
};

/**
 * Update an existing category.
 * @param {number} id
 * @param {object} data
 * @returns {Promise<object>} The updated category
 */
const update = async (id, data) => {
  const category = await categoriesRepository.findById(id);

  if (!category) {
    throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  }

  // Regenerate slug when name changes and no explicit slug is provided
  if (data.name && !data.slug) {
    data.slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Check slug uniqueness (exclude current record)
  if (data.slug) {
    const existing = await categoriesRepository.findBySlug(data.slug);
    if (existing && existing.id !== id) {
      throw Object.assign(new Error('A category with this slug already exists'), { statusCode: 409 });
    }
  }

  await categoriesRepository.update(id, data);
  return categoriesRepository.findById(id);
};

/**
 * Delete a category by ID.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const category = await categoriesRepository.findById(id);

  if (!category) {
    throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  }

  return categoriesRepository.delete(id);
};

module.exports = {
  getAll,
  getById,
  getActive,
  create,
  update,
  delete: remove,
};
