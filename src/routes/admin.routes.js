const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const { requireAdmin } = require('../middleware/auth.middleware');

const router = Router();

// All admin routes require authentication
router.use(requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/settings', adminController.getSettings);
router.put('/settings/:key', adminController.updateSetting);
router.get('/opening-hours', adminController.getOpeningHours);
router.put('/opening-hours/:id', adminController.updateOpeningHours);

module.exports = router;
