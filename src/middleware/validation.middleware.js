const { body, param, query, validationResult } = require('express-validator');
const { error } = require('../utils/response.util');

// ---------------------------------------------------------------------------
// Runner — call after any rule set to short-circuit on validation failure
// ---------------------------------------------------------------------------
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return error(res, 'Validation failed', 422, messages);
  }
  next();
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
const loginRules = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validate,
];

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
const categoryRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be 2-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be under 500 characters'),
  validate,
];

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
const productRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 150 })
    .withMessage('Product name must be 2-150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be under 1000 characters'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  body('category_id')
    .notEmpty()
    .withMessage('Category is required')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('is_available')
    .optional()
    .isBoolean()
    .withMessage('is_available must be a boolean'),
  validate,
];

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
const orderRules = [
  body('customer_name')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be 2-100 characters'),
  body('customer_email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('customer_phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9+\-() ]{7,20}$/)
    .withMessage('Phone number is invalid'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Each item must have a valid product ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item quantity must be at least 1'),
  body('special_instructions')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special instructions must be under 500 characters'),
  validate,
];

const orderStatusRules = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'])
    .withMessage('Invalid order status'),
  validate,
];

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------
const contactRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Subject must be 2-200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be 10-2000 characters'),
  validate,
];

// ---------------------------------------------------------------------------
// Shared param validators
// ---------------------------------------------------------------------------
const idParamRule = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  validate,
];

const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate,
];

module.exports = {
  validate,
  loginRules,
  categoryRules,
  productRules,
  orderRules,
  orderStatusRules,
  contactRules,
  idParamRule,
  paginationRules,
};
