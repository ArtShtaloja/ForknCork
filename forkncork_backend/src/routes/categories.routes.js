const { Router } = require('express');
const categoriesController = require('../controllers/categories.controller');
const { requireAdmin } = require('../middleware/auth.middleware');
const { categoryRules, idParamRule } = require('../middleware/validation.middleware');

const router = Router();

router.get('/', categoriesController.getAll);
router.get('/:id', idParamRule, categoriesController.getById);
router.post('/', requireAdmin, categoryRules, categoriesController.create);
router.put('/:id', requireAdmin, idParamRule, categoryRules, categoriesController.update);
router.delete('/:id', requireAdmin, idParamRule, categoriesController.delete);

module.exports = router;
