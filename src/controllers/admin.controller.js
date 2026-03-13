const ordersService = require('../services/orders.service.js');
const contactService = require('../services/contact.service.js');
const settingsService = require('../services/settings.service.js');
const response = require('../utils/response.util.js');

/**
 * GET /api/admin/dashboard
 * Aggregate dashboard data: order stats, unread messages, etc.
 */
const getDashboard = async (req, res, next) => {
  try {
    const [orderStats, unreadMessages] = await Promise.all([
      ordersService.getStats(),
      contactService.countUnread(),
    ]);

    return response.success(
      res,
      {
        orders: orderStats,
        unread_messages: unreadMessages,
      },
      'Dashboard data retrieved'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/settings
 */
const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getAll();
    return response.success(res, settings, 'Settings retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/settings/:key
 * Body: { value }
 */
const updateSetting = async (req, res, next) => {
  try {
    const setting = await settingsService.update(req.params.key, req.body.value);
    return response.success(res, setting, 'Setting updated');
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * GET /api/admin/opening-hours
 */
const getOpeningHours = async (req, res, next) => {
  try {
    const hours = await settingsService.getOpeningHours();
    return response.success(res, hours, 'Opening hours retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/opening-hours/:id
 * Body: { open_time, close_time, is_closed }
 */
const updateOpeningHours = async (req, res, next) => {
  try {
    await settingsService.updateOpeningHours(
      parseInt(req.params.id, 10),
      req.body
    );
    return response.success(res, null, 'Opening hours updated');
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

module.exports = {
  getDashboard,
  getSettings,
  updateSetting,
  getOpeningHours,
  updateOpeningHours,
};
