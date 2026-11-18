const express = require('express');
const ctrl = require('../controllers/ticketController');

const router = express.Router();

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.get);
router.post('/:ticketId/replies', ctrl.addReply);
router.post('/:id/close', ctrl.close);

module.exports = router;
