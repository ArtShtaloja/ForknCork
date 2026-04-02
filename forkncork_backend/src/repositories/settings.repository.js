const { pool } = require('../config/db.js');

const findAll = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM restaurant_settings'
  );
  return rows;
};

const findByKey = async (key) => {
  const [rows] = await pool.execute(
    'SELECT * FROM restaurant_settings WHERE setting_key = ?',
    [key]
  );
  return rows[0] || null;
};

const update = async (key, value) => {
  const [result] = await pool.execute(
    'UPDATE restaurant_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
    [value, key]
  );
  return result.affectedRows > 0;
};

const getOpeningHours = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM opening_hours ORDER BY day_of_week ASC'
  );
  return rows;
};

const updateOpeningHours = async (id, data) => {
  const fields = [];
  const values = [];

  if (data.open_time !== undefined) { fields.push('open_time = ?'); values.push(data.open_time); }
  if (data.close_time !== undefined) { fields.push('close_time = ?'); values.push(data.close_time); }
  if (data.is_closed !== undefined) { fields.push('is_closed = ?'); values.push(data.is_closed); }

  if (fields.length === 0) return false;

  fields.push('updated_at = NOW()');
  values.push(id);

  const [result] = await pool.execute(
    `UPDATE opening_hours SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
};

module.exports = {
  findAll,
  findByKey,
  update,
  getOpeningHours,
  updateOpeningHours,
};
