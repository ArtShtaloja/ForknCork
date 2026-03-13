const { pool } = require('../config/db.js');

const findAll = async (filters = {}) => {
  let query = 'SELECT * FROM orders';
  const conditions = [];
  const values = [];

  if (filters.status) {
    conditions.push('status = ?');
    values.push(filters.status);
  }

  if (filters.customer_email) {
    conditions.push('customer_email = ?');
    values.push(filters.customer_email);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  query += ' LIMIT ? OFFSET ?';
  values.push(limit, offset);

  const [rows] = await pool.execute(query, values);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM orders WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

const create = async (orderData) => {
  const [result] = await pool.execute(
    'INSERT INTO orders (customer_name, customer_email, customer_phone, order_type, status, total_amount, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [
      orderData.customer_name,
      orderData.customer_email,
      orderData.customer_phone || null,
      orderData.order_type || 'pickup',
      orderData.status || 'pending',
      orderData.total_amount,
      orderData.notes || null,
    ]
  );
  return result.insertId;
};

const createItems = async (orderId, items) => {
  if (!items || items.length === 0) return;

  const placeholders = items.map(() => '(?, ?, ?, ?, ?)').join(', ');
  const values = [];

  for (const item of items) {
    values.push(orderId, item.product_id, item.quantity, item.unit_price, item.subtotal);
  }

  const [result] = await pool.execute(
    `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES ${placeholders}`,
    values
  );
  return result.affectedRows;
};

const updateStatus = async (id, status) => {
  const [result] = await pool.execute(
    'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
    [status, id]
  );
  return result.affectedRows > 0;
};

const findItems = async (orderId) => {
  const [rows] = await pool.execute(
    'SELECT oi.*, p.name AS product_name FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
    [orderId]
  );
  return rows;
};

const count = async (filters = {}) => {
  let query = 'SELECT COUNT(*) AS total FROM orders';
  const conditions = [];
  const values = [];

  if (filters.status) {
    conditions.push('status = ?');
    values.push(filters.status);
  }

  if (filters.customer_email) {
    conditions.push('customer_email = ?');
    values.push(filters.customer_email);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  const [rows] = await pool.execute(query, values);
  return rows[0].total;
};

const getStats = async () => {
  const [totalRows] = await pool.execute(
    'SELECT COUNT(*) AS total_orders, COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders'
  );

  const [statusRows] = await pool.execute(
    'SELECT status, COUNT(*) AS count FROM orders GROUP BY status'
  );

  return {
    total_orders: totalRows[0].total_orders,
    total_revenue: totalRows[0].total_revenue,
    orders_by_status: statusRows,
  };
};

module.exports = {
  findAll,
  findById,
  create,
  createItems,
  updateStatus,
  findItems,
  count,
  getStats,
};
