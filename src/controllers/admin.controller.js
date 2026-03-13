const ordersService = require('../services/orders.service.js');
const contactService = require('../services/contact.service.js');
const settingsService = require('../services/settings.service.js');
const response = require('../utils/response.util.js');
const path = require('path');
const fs = require('fs');

const MENU_IMAGES_DIR = path.join(__dirname, '..', '..', 'public', 'images', 'menu');

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
 * GET /api/admin/analytics
 * Extended analytics with charts data.
 */
const getAnalytics = async (req, res, next) => {
  try {
    const [analytics, unreadMessages] = await Promise.all([
      ordersService.getAnalytics(),
      contactService.countUnread(),
    ]);

    return response.success(
      res,
      { ...analytics, unread_messages: unreadMessages },
      'Analytics data retrieved'
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

/**
 * GET /api/admin/images
 * List all images in public/images/menu/
 */
const getImages = async (req, res, next) => {
  try {
    if (!fs.existsSync(MENU_IMAGES_DIR)) {
      return response.success(res, [], 'No images directory');
    }

    const files = fs.readdirSync(MENU_IMAGES_DIR)
      .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .map(f => {
        const stats = fs.statSync(path.join(MENU_IMAGES_DIR, f));
        return {
          filename: f,
          url: `/images/menu/${f}`,
          size: stats.size,
          modified: stats.mtime,
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));

    return response.success(res, files, 'Images retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/images
 * Upload image to public/images/menu/
 */
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return response.error(res, 'No image file provided', 400);
    }

    if (!fs.existsSync(MENU_IMAGES_DIR)) {
      fs.mkdirSync(MENU_IMAGES_DIR, { recursive: true });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const baseName = req.file.originalname
      .replace(ext, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    const filename = baseName + ext;
    const destPath = path.join(MENU_IMAGES_DIR, filename);

    fs.renameSync(req.file.path, destPath);

    return response.success(
      res,
      { filename, url: `/images/menu/${filename}` },
      'Image uploaded',
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/images/:filename
 * Delete an image from public/images/menu/
 */
const deleteImage = async (req, res, next) => {
  try {
    const filename = req.params.filename;

    if (!filename || filename.includes('..') || filename.includes('/')) {
      return response.error(res, 'Invalid filename', 400);
    }

    const filePath = path.join(MENU_IMAGES_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return response.error(res, 'Image not found', 404);
    }

    fs.unlinkSync(filePath);
    return response.success(res, null, 'Image deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
  getAnalytics,
  getSettings,
  updateSetting,
  getOpeningHours,
  updateOpeningHours,
  getImages,
  uploadImage,
  deleteImage,
};
