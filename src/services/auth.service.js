const bcrypt = require('bcrypt');
const authRepository = require('../repositories/auth.repository.js');

/**
 * Authenticate an admin by email and password.
 *
 * @param {string} email
 * @param {string} password - Plain-text password to verify
 * @returns {Promise<object>} Admin record (without password hash)
 * @throws {Error} If credentials are invalid
 */
const login = async (email, password) => {
  const admin = await authRepository.findAdminByEmail(email);

  if (!admin) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  await authRepository.updateLastLogin(admin.id);

  // Strip the password hash before returning
  const { password: _pwd, ...adminData } = admin;
  return adminData;
};

/**
 * Retrieve an admin profile by ID.
 *
 * @param {number} id
 * @returns {Promise<object|null>} Admin record (without password hash), or null
 */
const getAdminById = async (id) => {
  const admin = await authRepository.findAdminById(id);

  if (!admin) {
    return null;
  }

  const { password: _pwd, ...adminData } = admin;
  return adminData;
};

module.exports = {
  login,
  getAdminById,
};
