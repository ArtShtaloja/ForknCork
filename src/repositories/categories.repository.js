const { pool } = require('../config/db.js');

const findAll = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY sort_order ASC'
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return rows[0] || null;
};

const findBySlug = async (slug) => {
  const [rows] = await pool.execute(
    'SELECT * FROM categories WHERE slug = ? AND deleted_at IS NULL',
    [slug]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.execute(
    'INSERT INTO categories (name, slug, description, image_url, is_active, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [data.name, data.slug, data.description || null, data.image_url || null, data.is_active ?? 1, data.sort_order ?? 0]
  );
  return result.insertId;
};

const update = async (id, data) => {
  const fields = [];
  const values = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.slug !== undefined) { fields.push('slug = ?'); values.push(data.slug); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.image_url !== undefined) { fields.push('image_url = ?'); values.push(data.image_url); }
  if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }
  if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order); }

  if (fields.length === 0) return false;

  fields.push('updated_at = NOW()');
  values.push(id);

  const [result] = await pool.execute(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

const remove = async (id) => {
  const [result] = await pool.execute(
    'UPDATE categories SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return result.affectedRows > 0;
};

const findActive = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM categories WHERE is_active = 1 AND deleted_at IS NULL ORDER BY sort_order ASC'
  );
  return rows;
};

module.exports = {
  findAll,
  findById,
  findBySlug,
  create,
  update,
  delete: remove,
  findActive,
};
