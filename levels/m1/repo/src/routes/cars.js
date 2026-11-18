const express = require('express');
const ctrl = require('../controllers/carController');

const router = express.Router();

router.get('/mine', ctrl.listMine);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getOne);
router.patch('/:id', ctrl.update);

module.exports = router;
