const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { requireAdmin } = require('../middleware/auth.middleware');
const { loginRules } = require('../middleware/validation.middleware');

const router = Router();

router.post('/login', loginRules, authController.login);
router.post('/logout', authController.logout);
router.get('/profile', requireAdmin, authController.getProfile);

module.exports = router;
