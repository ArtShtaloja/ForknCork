const { pool } = require('../config/db.js');

const findAll = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM reviews ORDER BY created_at DESC'
  );
  return rows;
};

const findApproved = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM reviews WHERE is_approved = 1 ORDER BY created_at DESC'
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM reviews WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.execute(
    'INSERT INTO reviews (customer_name, rating, comment, is_approved, created_at) VALUES (?, ?, ?, 0, NOW())',
    [data.customer_name, data.rating, data.comment || null]
  );
  return result.insertId;
};

const approve = async (id) => {
  const [result] = await pool.execute(
    'UPDATE reviews SET is_approved = 1 WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
};

const remove = async (id) => {
  const [result] = await pool.execute(
    'DELETE FROM reviews WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  findAll,
  findApproved,
  findById,
  create,
  approve,
  delete: remove,
};
