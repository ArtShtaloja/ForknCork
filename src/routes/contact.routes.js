const { Router } = require('express');
const contactController = require('../controllers/contact.controller');
const { requireAdmin } = require('../middleware/auth.middleware');
const { contactRules, idParamRule } = require('../middleware/validation.middleware');

const router = Router();

router.post('/', contactRules, contactController.create);
router.get('/', requireAdmin, contactController.getAll);
router.get('/unread/count', requireAdmin, contactController.countUnread);
router.get('/:id', requireAdmin, idParamRule, contactController.getById);
router.put('/:id/read', requireAdmin, idParamRule, contactController.markAsRead);
router.delete('/:id', requireAdmin, idParamRule, contactController.delete);

module.exports = router;
