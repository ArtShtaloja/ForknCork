const contactService = require('../services/contact.service.js');
const response = require('../utils/response.util.js');

/**
 * GET /api/contact
 */
const getAll = async (req, res, next) => {
  try {
    const messages = await contactService.getAll();
    return response.success(res, messages, 'Contact messages retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/contact/:id
 */
const getById = async (req, res, next) => {
  try {
    const message = await contactService.getById(parseInt(req.params.id, 10));
    return response.success(res, message, 'Contact message retrieved');
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * POST /api/contact
 */
const create = async (req, res, next) => {
  try {
    const message = await contactService.create(req.body);
    return response.success(res, message, 'Contact message sent', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/contact/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const message = await contactService.markAsRead(parseInt(req.params.id, 10));
    return response.success(res, message, 'Message marked as read');
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * DELETE /api/contact/:id
 */
const remove = async (req, res, next) => {
  try {
    await contactService.delete(parseInt(req.params.id, 10));
    return response.success(res, null, 'Contact message deleted');
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * GET /api/contact/unread/count
 */
const countUnread = async (req, res, next) => {
  try {
    const count = await contactService.countUnread();
    return response.success(res, { unread_count: count }, 'Unread count retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  markAsRead,
  delete: remove,
  countUnread,
};
