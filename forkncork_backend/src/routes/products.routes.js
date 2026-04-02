const path = require('path');
const { Router } = require('express');
const multer = require('multer');
const productsController = require('../controllers/products.controller');
const { requireAdmin } = require('../middleware/auth.middleware');
const { productRules, idParamRule, paginationRules } = require('../middleware/validation.middleware');

// ---------------------------------------------------------------------------
// Multer configuration
// ---------------------------------------------------------------------------
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, 'uploads/');
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
const router = Router();

router.get('/', paginationRules, productsController.getAll);
router.get('/featured', productsController.getFeatured);
router.get('/:id', idParamRule, productsController.getById);
router.post('/', requireAdmin, upload.single('image'), productRules, productsController.create);
router.put('/:id', requireAdmin, upload.single('image'), idParamRule, productsController.update);
router.delete('/:id', requireAdmin, idParamRule, productsController.delete);
router.post('/:id/images', requireAdmin, upload.single('image'), idParamRule, productsController.uploadImage);
router.delete('/images/:imageId', requireAdmin, productsController.deleteImage);

module.exports = router;
