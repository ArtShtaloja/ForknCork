const { pool } = require('../config/db.js');

const findAll = async (filters = {}) => {
  let query = 'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id';
  const conditions = ['p.deleted_at IS NULL'];
  const values = [];

  if (filters.category_id) {
    conditions.push('p.category_id = ?');
    values.push(filters.category_id);
  }

  if (filters.is_available !== undefined) {
    conditions.push('p.is_available = ?');
    values.push(filters.is_available);
  }

  if (filters.search) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    values.push(searchTerm, searchTerm);
  }

  query += ' WHERE ' + conditions.join(' AND ');

  query += ' ORDER BY p.created_at DESC';

  const limit = parseInt(filters.limit, 10) || 20;
  const offset = parseInt(filters.offset, 10) || 0;
  query += ` LIMIT ${limit} OFFSET ${offset}`;

  const [rows] = await pool.query(query, values);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ? AND p.deleted_at IS NULL',
    [id]
  );
  return rows[0] || null;
};

const findBySlug = async (slug) => {
  const [rows] = await pool.execute(
    'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ? AND p.deleted_at IS NULL',
    [slug]
  );
  return rows[0] || null;
};

const findByCategory = async (categoryId) => {
  const [rows] = await pool.execute(
    'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.category_id = ? AND p.deleted_at IS NULL ORDER BY p.created_at DESC',
    [categoryId]
  );
  return rows;
};

const findFeatured = async () => {
  const [rows] = await pool.execute(
    'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_featured = 1 AND p.is_available = 1 AND p.deleted_at IS NULL ORDER BY p.created_at DESC'
  );
  return rows;
};

const create = async (data) => {
  const [result] = await pool.execute(
    'INSERT INTO products (category_id, name, slug, description, price, image_url, is_available, is_featured, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [
      data.category_id,
      data.name,
      data.slug,
      data.description || null,
      data.price,
      data.image_url || null,
      data.is_available ?? 1,
      data.is_featured ?? 0,
    ]
  );
  return result.insertId;
};

const update = async (id, data) => {
  const fields = [];
  const values = [];

  if (data.category_id !== undefined) { fields.push('category_id = ?'); values.push(data.category_id); }
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.slug !== undefined) { fields.push('slug = ?'); values.push(data.slug); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
  if (data.image_url !== undefined) { fields.push('image_url = ?'); values.push(data.image_url); }
  if (data.is_available !== undefined) { fields.push('is_available = ?'); values.push(data.is_available); }
  if (data.is_featured !== undefined) { fields.push('is_featured = ?'); values.push(data.is_featured); }

  if (fields.length === 0) return false;

  fields.push('updated_at = NOW()');
  values.push(id);

  const [result] = await pool.execute(
    `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

const remove = async (id) => {
  const [result] = await pool.execute(
    'UPDATE products SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return result.affectedRows > 0;
};

const findImages = async (productId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC',
    [productId]
  );
  return rows;
};

const addImage = async (productId, imagePath, isPrimary = 0) => {
  const [result] = await pool.execute(
    'INSERT INTO product_images (product_id, image_path, is_primary, created_at) VALUES (?, ?, ?, NOW())',
    [productId, imagePath, isPrimary]
  );
  return result.insertId;
};

const deleteImage = async (imageId) => {
  const [result] = await pool.execute(
    'DELETE FROM product_images WHERE id = ?',
    [imageId]
  );
  return result.affectedRows > 0;
};

const count = async (filters = {}) => {
  let query = 'SELECT COUNT(*) AS total FROM products p';
  const conditions = ['p.deleted_at IS NULL'];
  const values = [];

  if (filters.category_id) {
    conditions.push('p.category_id = ?');
    values.push(filters.category_id);
  }

  if (filters.is_available !== undefined) {
    conditions.push('p.is_available = ?');
    values.push(filters.is_available);
  }

  if (filters.search) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    values.push(searchTerm, searchTerm);
  }

  query += ' WHERE ' + conditions.join(' AND ');

  const [rows] = await pool.execute(query, values);
  return rows[0].total;
};

module.exports = {
  findAll,
  findById,
  findBySlug,
  findByCategory,
  findFeatured,
  create,
  update,
  delete: remove,
  findImages,
  addImage,
  deleteImage,
  count,
};
