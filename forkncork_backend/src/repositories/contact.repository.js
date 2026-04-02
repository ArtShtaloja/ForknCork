const { pool } = require('../config/db.js');

const findAll = async () => {
  const [rows] = await pool.execute(
    'SELECT * FROM contact_messages WHERE deleted_at IS NULL ORDER BY created_at DESC'
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM contact_messages WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.execute(
    'INSERT INTO contact_messages (name, email, phone, subject, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW())',
    [data.name, data.email, data.phone || null, data.subject || null, data.message]
  );
  return result.insertId;
};

const markAsRead = async (id) => {
  const [result] = await pool.execute(
    'UPDATE contact_messages SET is_read = 1 WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
};

const remove = async (id) => {
  const [result] = await pool.execute(
    'UPDATE contact_messages SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return result.affectedRows > 0;
};

const countUnread = async () => {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM contact_messages WHERE is_read = 0 AND deleted_at IS NULL'
  );
  return rows[0].total;
};

module.exports = {
  findAll,
  findById,
  create,
  markAsRead,
  delete: remove,
  countUnread,
};
