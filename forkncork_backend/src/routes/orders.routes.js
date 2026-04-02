const { Router } = require('express');
const ordersController = require('../controllers/orders.controller');
const { requireAdmin } = require('../middleware/auth.middleware');
const { orderRules, orderStatusRules, idParamRule, paginationRules } = require('../middleware/validation.middleware');

const router = Router();

router.post('/', orderRules, ordersController.create);
router.get('/', requireAdmin, paginationRules, ordersController.getAll);
router.get('/stats', requireAdmin, ordersController.getStats);
router.get('/:id', requireAdmin, idParamRule, ordersController.getById);
router.put('/:id/status', requireAdmin, idParamRule, orderStatusRules, ordersController.updateStatus);

module.exports = router;
