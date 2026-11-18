const express = require('express');
const ctrl = require('../controllers/movieController');

const router = express.Router();
router.get('/search', ctrl.search);

module.exports = router;
