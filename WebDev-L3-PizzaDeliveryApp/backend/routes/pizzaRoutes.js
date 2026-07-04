const express = require('express');
const router = express.Router();
const { getCatalog } = require('../controllers/pizzaController');

router.get('/catalog', getCatalog);

module.exports = router;