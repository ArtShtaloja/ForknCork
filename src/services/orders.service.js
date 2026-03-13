const ordersRepository = require('../repositories/orders.repository.js');

/**
 * Get all orders with optional filters and pagination.
 * @param {object} filters - { status, customer_email, page, limit }
 * @returns {Promise<{ orders: Array, total: number, page: number, limit: number }>}
 */
const getAll = async (filters = {}) => {
  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const repoFilters = {
    ...filters,
    limit,
    offset,
  };

  const [orders, total] = await Promise.all([
    ordersRepository.findAll(repoFilters),
    ordersRepository.count(repoFilters),
  ]);

  return { orders, total, page, limit };
};

/**
 * Get a single order by ID, including its line items.
 * @param {number} id
 * @returns {Promise<object>}
 * @throws {Error} If not found
 */
const getById = async (id) => {
  const order = await ordersRepository.findById(id);

  if (!order) {
    throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  }

  order.items = await ordersRepository.findItems(id);
  return order;
};

/**
 * Create a new order with line items.
 *
 * Expects `orderData` for the header row and `items` as an array of
 * { product_id, quantity, unit_price }. The service calculates subtotals
 * and the order total.
 *
 * @param {object} orderData - { customer_name, customer_email, customer_phone, order_type, notes }
 * @param {Array}  items     - [{ product_id, quantity, unit_price }]
 * @returns {Promise<object>} The fully populated order
 */
const create = async (orderData, items) => {
  if (!items || items.length === 0) {
    throw Object.assign(new Error('Order must contain at least one item'), { statusCode: 400 });
  }

  // Calculate subtotals per line item and the grand total
  let totalAmount = 0;
  const enrichedItems = items.map((item) => {
    const subtotal = parseFloat((item.quantity * item.unit_price).toFixed(2));
    totalAmount += subtotal;
    return {
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal,
    };
  });

  totalAmount = parseFloat(totalAmount.toFixed(2));

  const orderId = await ordersRepository.create({
    ...orderData,
    total_amount: totalAmount,
  });

  await ordersRepository.createItems(orderId, enrichedItems);

  return getById(orderId);
};

/**
 * Update the status of an order.
 * @param {number} id
 * @param {string} status
 * @returns {Promise<object>} The updated order
 */
const updateStatus = async (id, status) => {
  const order = await ordersRepository.findById(id);

  if (!order) {
    throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  }

  await ordersRepository.updateStatus(id, status);
  return getById(id);
};

/**
 * Get aggregate order statistics.
 * @returns {Promise<object>}
 */
const getStats = async () => {
  return ordersRepository.getStats();
};

module.exports = {
  getAll,
  getById,
  create,
  updateStatus,
  getStats,
};
