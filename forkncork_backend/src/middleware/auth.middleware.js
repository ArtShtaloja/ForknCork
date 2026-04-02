const { error } = require('../utils/response.util');

/**
 * Require an authenticated admin session.
 * Checks that `req.session.admin` has been set by a successful login.
 */
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.admin) {
    return error(res, 'Unauthorized. Please log in as admin.', 401);
  }
  next();
}

/**
 * Optionally attach admin info to the request if a session exists,
 * but do NOT block the request when there is no session.
 */
function optionalAdmin(req, _res, next) {
  if (req.session && req.session.admin) {
    req.admin = req.session.admin;
  }
  next();
}

module.exports = { requireAdmin, optionalAdmin };
