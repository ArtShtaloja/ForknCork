const categoriesService = require('../services/categories.service.js');
const response = require('../utils/response.util.js');

/**
 * GET /api/categories
 */
const getAll = async (req, res, next) => {
  try {
    const categories = await categoriesService.getAll();
    return response.success(res, categories, 'Categories retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/categories/active
 */
const getActive = async (req, res, next) => {
  try {
    const categories = await categoriesService.getActive();
    return response.success(res, categories, 'Active categories retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/categories/:id
 */
const getById = async (req, res, next) => {
  try {
    const category = await categoriesService.getById(parseInt(req.params.id, 10));
    return response.success(res, category, 'Category retrieved');
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * POST /api/categories
 */
const create = async (req, res, next) => {
  try {
    const category = await categoriesService.create(req.body);
    return response.success(res, category, 'Category created', 201);
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * PUT /api/categories/:id
 */
const update = async (req, res, next) => {
  try {
    const category = await categoriesService.update(
      parseInt(req.params.id, 10),
      req.body
    );
    return response.success(res, category, 'Category updated');
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * DELETE /api/categories/:id
 */
const remove = async (req, res, next) => {
  try {
    await categoriesService.delete(parseInt(req.params.id, 10));
    return response.success(res, null, 'Category deleted');
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

module.exports = {
  getAll,
  getActive,
  getById,
  create,
  update,
  delete: remove,
};
