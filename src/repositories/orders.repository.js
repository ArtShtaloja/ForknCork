const { pool } = require('../config/db.js');

const findAll = async (filters = {}) => {
  let query = 'SELECT * FROM orders';
  const conditions = ['deleted_at IS NULL'];
  const values = [];

  if (filters.status) {
    conditions.push('status = ?');
    values.push(filters.status);
  }

  if (filters.customer_email) {
    conditions.push('customer_email = ?');
    values.push(filters.customer_email);
  }

  query += ' WHERE ' + conditions.join(' AND ');

  query += ' ORDER BY created_at DESC';

  const limit = parseInt(filters.limit, 10) || 20;
  const offset = parseInt(filters.offset, 10) || 0;
  query += ` LIMIT ${limit} OFFSET ${offset}`;

  const [rows] = await pool.query(query, values);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL',
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
  const conditions = ['deleted_at IS NULL'];
  const values = [];

  if (filters.status) {
    conditions.push('status = ?');
    values.push(filters.status);
  }

  if (filters.customer_email) {
    conditions.push('customer_email = ?');
    values.push(filters.customer_email);
  }

  query += ' WHERE ' + conditions.join(' AND ');

  const [rows] = await pool.execute(query, values);
  return rows[0].total;
};

const getStats = async () => {
  const [totalRows] = await pool.execute(
    'SELECT COUNT(*) AS total_orders, COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders WHERE deleted_at IS NULL'
  );

  const [statusRows] = await pool.execute(
    'SELECT status, COUNT(*) AS count FROM orders WHERE deleted_at IS NULL GROUP BY status'
  );

  return {
    total_orders: totalRows[0].total_orders,
    total_revenue: totalRows[0].total_revenue,
    orders_by_status: statusRows,
  };
};

const getAnalytics = async () => {
  // Today's stats
  const [todayRows] = await pool.execute(
    `SELECT COUNT(*) AS orders_today, COALESCE(SUM(total_amount), 0) AS revenue_today
     FROM orders WHERE DATE(created_at) = CURDATE() AND deleted_at IS NULL`
  );

  // This week's revenue
  const [weekRows] = await pool.execute(
    `SELECT COALESCE(SUM(total_amount), 0) AS revenue_week
     FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND deleted_at IS NULL`
  );

  // This month's revenue
  const [monthRows] = await pool.execute(
    `SELECT COALESCE(SUM(total_amount), 0) AS revenue_month
     FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND deleted_at IS NULL`
  );

  // Orders per day (last 14 days)
  const [dailyOrders] = await pool.execute(
    `SELECT DATE(created_at) AS date, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS revenue
     FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND deleted_at IS NULL
     GROUP BY DATE(created_at) ORDER BY date ASC`
  );

  // Top selling products (last 30 days)
  const [topProducts] = await pool.execute(
    `SELECT oi.product_id, p.name, SUM(oi.quantity) AS total_sold, SUM(oi.subtotal) AS total_revenue
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     LEFT JOIN orders o ON oi.order_id = o.id
     WHERE oi.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND o.deleted_at IS NULL
     GROUP BY oi.product_id, p.name
     ORDER BY total_sold DESC LIMIT 10`
  );

  // Recent orders (last 10)
  const [recentOrders] = await pool.execute(
    `SELECT o.*, GROUP_CONCAT(oi.product_name SEPARATOR ', ') AS item_names
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.deleted_at IS NULL
     GROUP BY o.id
     ORDER BY o.created_at DESC LIMIT 10`
  );

  // Orders by status
  const [statusRows] = await pool.execute(
    'SELECT status, COUNT(*) AS count FROM orders WHERE deleted_at IS NULL GROUP BY status'
  );

  // Total counts
  const [totalRows] = await pool.execute(
    'SELECT COUNT(*) AS total_orders, COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders WHERE deleted_at IS NULL'
  );

  const [productCount] = await pool.execute('SELECT COUNT(*) AS count FROM products WHERE deleted_at IS NULL');
  const [categoryCount] = await pool.execute('SELECT COUNT(*) AS count FROM categories WHERE deleted_at IS NULL');

  return {
    total_orders: totalRows[0].total_orders,
    total_revenue: totalRows[0].total_revenue,
    total_products: productCount[0].count,
    total_categories: categoryCount[0].count,
    orders_today: todayRows[0].orders_today,
    revenue_today: todayRows[0].revenue_today,
    revenue_week: weekRows[0].revenue_week,
    revenue_month: monthRows[0].revenue_month,
    daily_orders: dailyOrders,
    top_products: topProducts,
    recent_orders: recentOrders,
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
  getAnalytics,
};
