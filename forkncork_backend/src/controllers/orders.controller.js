const ordersService = require('../services/orders.service.js');
const response = require('../utils/response.util.js');

/**
 * GET /api/orders
 * Supports query params: status, customer_email, page, limit
 */
const getAll = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      customer_email: req.query.customer_email,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    };

    const { orders, total, page, limit } = await ordersService.getAll(filters);
    return response.paginate(res, orders, page, limit, total);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/orders/:id
 */
const getById = async (req, res, next) => {
  try {
    const order = await ordersService.getById(parseInt(req.params.id, 10));
    return response.success(res, order, 'Order retrieved');
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * POST /api/orders
 * Body: { customer_name, customer_email, customer_phone, order_type, notes, items: [{ product_id, quantity, unit_price }] }
 */
const create = async (req, res, next) => {
  try {
    const { items, ...orderData } = req.body;

    const order = await ordersService.create(orderData, items);
    return response.success(res, order, 'Order created', 201);
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * PATCH /api/orders/:id/status
 * Body: { status }
 */
const updateStatus = async (req, res, next) => {
  try {
    const order = await ordersService.updateStatus(
      parseInt(req.params.id, 10),
      req.body.status
    );
    return response.success(res, order, 'Order status updated');
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * GET /api/orders/stats
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await ordersService.getStats();
    return response.success(res, stats, 'Order statistics retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  updateStatus,
  getStats,
};
