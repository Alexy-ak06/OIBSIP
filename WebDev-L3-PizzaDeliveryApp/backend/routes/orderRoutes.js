const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  createRazorpayOrder,
  confirmPayment
} = require('../controllers/orderController');
const { protectUser } = require('../middleware/authMiddleware');

router.post('/', protectUser, createOrder);
router.get('/my-orders', protectUser, getMyOrders);
router.post('/:id/create-razorpay-order', protectUser, createRazorpayOrder);
router.post('/:id/confirm-payment', protectUser, confirmPayment);

module.exports = router;