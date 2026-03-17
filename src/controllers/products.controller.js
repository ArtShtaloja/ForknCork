const productsService = require('../services/products.service.js');
const response = require('../utils/response.util.js');

/**
 * GET /api/products
 * Supports query params: category_id, is_available, search, page, limit
 */
const getAll = async (req, res, next) => {
  try {
    const filters = {
      category_id: req.query.category_id,
      is_available: req.query.is_available,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    };

    console.log('[DEBUG] Products Controller: Fetching with filters:', filters);
    const { products, total, page, limit } = await productsService.getAll(filters);
    return response.paginate(res, products, page, limit, total);
  } catch (err) {
    console.error('[CRITICAL DEBUG] Products Controller Error:', err);
    // Return detailed error directly to bypass stale error middleware
    return res.status(500).json({
      success: false,
      message: 'CRITICAL DEBUG FAIL',
      error: err.message,
      sqlMessage: err.sqlMessage,
      code: err.code,
      stack: err.stack,
      db_info: {
        host: process.env.DB_HOST,
        db: process.env.DB_NAME,
        has_url: !!process.env.DATABASE_URL
      }
    });
  }
};

/**
 * GET /api/products/featured
 */
const getFeatured = async (req, res, next) => {
  try {
    const products = await productsService.getFeatured();
    return response.success(res, products);
  } catch (err) {
    console.error('[CRITICAL DEBUG] Featured Controller Error:', err);
    return res.status(500).json({
      success: false,
      message: 'CRITICAL DEBUG FAIL (FEATURED)',
      error: err.message,
      sqlMessage: err.sqlMessage,
      code: err.code,
      stack: err.stack
    });
  }
};

/**
 * GET /api/products/category/:categoryId
 */
const getByCategory = async (req, res, next) => {
  try {
    const products = await productsService.getByCategory(
      parseInt(req.params.categoryId, 10)
    );
    return response.success(res, products, 'Products retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id
 */
const getById = async (req, res, next) => {
  try {
    const product = await productsService.getById(parseInt(req.params.id, 10));
    return response.success(res, product, 'Product retrieved');
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * POST /api/products
 * Accepts multipart form data — the image file is available via req.file (multer).
 */
const create = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // If multer attached an uploaded file, set the image_url
    if (req.file) {
      data.image_url = req.file.path || req.file.filename;
    }

    const product = await productsService.create(data);
    return response.success(res, product, 'Product created', 201);
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * PUT /api/products/:id
 * Accepts multipart form data — the image file is available via req.file (multer).
 */
const update = async (req, res, next) => {
  try {
    const data = { ...req.body };

    if (req.file) {
      data.image_url = req.file.path || req.file.filename;
    }

    const product = await productsService.update(
      parseInt(req.params.id, 10),
      data
    );
    return response.success(res, product, 'Product updated');
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * DELETE /api/products/:id
 */
const remove = async (req, res, next) => {
  try {
    await productsService.delete(parseInt(req.params.id, 10));
    return response.success(res, null, 'Product deleted');
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * POST /api/products/:id/images
 * Upload an image for a product. Expects req.file from multer.
 */
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return response.error(res, 'No image file provided', 400);
    }

    const productId = parseInt(req.params.id, 10);
    const imagePath = req.file.path || req.file.filename;
    const isPrimary = req.body.is_primary ? 1 : 0;

    const imageId = await productsService.addImage(productId, imagePath, isPrimary);
    return response.success(res, { id: imageId, product_id: productId, image_path: imagePath, is_primary: isPrimary }, 'Image uploaded', 201);
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

/**
 * DELETE /api/products/images/:imageId
 */
const deleteImage = async (req, res, next) => {
  try {
    await productsService.deleteImage(parseInt(req.params.imageId, 10));
    return response.success(res, null, 'Image deleted');
  } catch (err) {
    if (err.statusCode) {
      return response.error(res, err.message, err.statusCode);
    }
    next(err);
  }
};

module.exports = {
  getAll,
  getFeatured,
  getByCategory,
  getById,
  create,
  update,
  delete: remove,
  uploadImage,
  deleteImage,
};
