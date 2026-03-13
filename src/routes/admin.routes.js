const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/admin.controller');
const { requireAdmin } = require('../middleware/auth.middleware');

const router = Router();

// Multer config for image uploads
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
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
];

const upload = multer({
  storage,
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// All admin routes require authentication
router.use(requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/analytics', adminController.getAnalytics);
router.get('/settings', adminController.getSettings);
router.put('/settings/:key', adminController.updateSetting);
router.get('/opening-hours', adminController.getOpeningHours);
router.put('/opening-hours/:id', adminController.updateOpeningHours);

// Image management
router.get('/images', adminController.getImages);
router.post('/images', upload.single('image'), adminController.uploadImage);
router.delete('/images/:filename', adminController.deleteImage);

module.exports = router;
