const express = require('express');
const router = express.Router();
const { setupAdmin, loginAdmin } = require('../controllers/adminController');
const { getAllInventory, updateStock } = require('../controllers/inventoryController');
const { getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/setup', setupAdmin);
router.post('/login', loginAdmin);

router.get('/inventory', protectAdmin, getAllInventory);
router.put('/inventory/:id', protectAdmin, updateStock);

router.get('/orders', protectAdmin, getAllOrders);
router.put('/orders/:id/status', protectAdmin, updateOrderStatus);

module.exports = router;