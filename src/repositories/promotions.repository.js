const { pool } = require('../config/db.js');

const findAll = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM promotions ORDER BY created_at DESC'
  );
  return rows;
};

const findActive = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM promotions WHERE is_active = 1 AND start_date <= NOW() AND end_date >= NOW() ORDER BY created_at DESC'
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM promotions WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.execute(
    'INSERT INTO promotions (title, description, image_url, discount_type, discount_value, start_date, end_date, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [
      data.title,
      data.description || null,
      data.image_url || null,
      data.discount_type || null,
      data.discount_value || null,
      data.start_date,
      data.end_date,
      data.is_active ?? 1,
    ]
  );
  return result.insertId;
};

const update = async (id, data) => {
  const fields = [];
  const values = [];

  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.image_url !== undefined) { fields.push('image_url = ?'); values.push(data.image_url); }
  if (data.discount_type !== undefined) { fields.push('discount_type = ?'); values.push(data.discount_type); }
  if (data.discount_value !== undefined) { fields.push('discount_value = ?'); values.push(data.discount_value); }
  if (data.start_date !== undefined) { fields.push('start_date = ?'); values.push(data.start_date); }
  if (data.end_date !== undefined) { fields.push('end_date = ?'); values.push(data.end_date); }
  if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

  if (fields.length === 0) return false;

  fields.push('updated_at = NOW()');
  values.push(id);

  const [result] = await pool.execute(
    `UPDATE promotions SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

const remove = async (id) => {
  const [result] = await pool.execute(
    'DELETE FROM promotions WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  findAll,
  findActive,
  findById,
  create,
  update,
  delete: remove,
};
