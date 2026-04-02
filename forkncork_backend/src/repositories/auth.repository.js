const { pool } = require('../config/db.js');

const findAdminByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT * FROM admins WHERE email = ?',
    [email]
  );
  return rows[0] || null;
};

const findAdminById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM admins WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

const updateLastLogin = async (id) => {
  const [result] = await pool.execute(
    'UPDATE admins SET updated_at = NOW() WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  findAdminByEmail,
  findAdminById,
  updateLastLogin,
};
