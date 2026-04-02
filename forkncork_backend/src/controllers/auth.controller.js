const authService = require('../services/auth.service.js');
const response = require('../utils/response.util.js');

/**
 * POST /api/auth/login
 * Authenticate an admin and establish a session.
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const admin = await authService.login(username, password);

    // Persist admin in the session
    req.session.admin = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
    };

    return response.success(res, admin, 'Login successful');
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Destroy the current admin session.
 */
const logout = async (req, res, next) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return response.error(res, 'Failed to log out', 500);
      }
      res.clearCookie('connect.sid');
      return response.success(res, null, 'Logged out successfully');
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/profile
 * Return the currently authenticated admin's profile.
 */
const getProfile = async (req, res, next) => {
  try {
    const admin = await authService.getAdminById(req.session.admin.id);

    if (!admin) {
      return response.error(res, 'Admin not found', 404);
    }

    return response.success(res, admin, 'Profile retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  logout,
  getProfile,
};
