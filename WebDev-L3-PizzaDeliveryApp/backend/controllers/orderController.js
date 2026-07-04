const crypto = require('crypto');
const Order = require('../models/Order');
const InventoryItem = require('../models/InventoryItem');
const razorpayInstance = require('../utils/razorpay');

const PRICE_PER_ITEM = {
  base: 150,
  sauce: 20,
  cheese: 50,
  vegetable: 15
};

// @route POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { base, sauce, cheese, vegetables, quantity } = req.body;

    if (!base || !sauce || !cheese) {
      return res.status(400).json({ message: 'Base, sauce, and cheese are required' });
    }

    const qty = quantity || 1;

    const baseItem = await InventoryItem.findById(base);
    const sauceItem = await InventoryItem.findById(sauce);
    const cheeseItem = await InventoryItem.findById(cheese);
    const vegItems = vegetables?.length
      ? await InventoryItem.find({ _id: { $in: vegetables } })
      : [];

    if (!baseItem || !sauceItem || !cheeseItem) {
      return res.status(404).json({ message: 'One or more selected items not found' });
    }

    if (baseItem.stock < qty || sauceItem.stock < qty || cheeseItem.stock < qty) {
      return res.status(400).json({ message: 'Selected items are out of stock' });
    }

    const totalAmount =
      (PRICE_PER_ITEM.base + PRICE_PER_ITEM.sauce + PRICE_PER_ITEM.cheese) * qty +
      vegItems.length * PRICE_PER_ITEM.vegetable * qty;

    const order = await Order.create({
      user: req.user._id,
      pizzaConfig: { base, sauce, cheese, vegetables: vegetables || [] },
      quantity: qty,
      totalAmount
    });

    res.status(201).json({ message: 'Order created', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route GET /api/orders/my-orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('pizzaConfig.base pizzaConfig.sauce pizzaConfig.cheese pizzaConfig.vegetables')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route POST /api/orders/:id/create-razorpay-order
// Creates a Razorpay order object — called right before showing the checkout popup
const createRazorpayOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized for this order' });
    }

    // Razorpay expects amount in paise (smallest currency unit)
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: order.totalAmount * 100,
      currency: 'INR',
      receipt: `order_${order._id}`
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ message: 'Razorpay order creation failed', error: err.message });
  }
};

// @route POST /api/orders/:id/confirm-payment
// Verifies Razorpay's payment signature, then marks order paid and decrements stock
const confirmPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized for this order' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order already paid' });
    }

    // Verify signature: HMAC-SHA256 of "order_id|payment_id" using our key secret
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed — signature mismatch' });
    }

    // Signature valid — decrement stock
    const { base, sauce, cheese, vegetables } = order.pizzaConfig;
    const idsToDecrement = [base, sauce, cheese, ...vegetables];

    for (const itemId of idsToDecrement) {
      const item = await InventoryItem.findById(itemId);
      if (item) {
        item.stock = Math.max(0, item.stock - order.quantity);
        await item.save();
      }
    }

    order.paymentStatus = 'paid';
    order.paymentId = razorpay_payment_id;
    await order.save();

    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('orderStatusUpdate', {
      orderId: order._id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus
    });

    res.json({ message: 'Payment verified, order placed', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route GET /api/admin/orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('pizzaConfig.base pizzaConfig.sauce pizzaConfig.cheese pizzaConfig.vegetables')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route PUT /api/admin/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const validStatuses = ['Order Received', 'In Kitchen', 'Sent to Delivery'];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.orderStatus = orderStatus;
    await order.save();

    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('orderStatusUpdate', {
      orderId: order._id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus
    });

    res.json({ message: 'Order status updated', order });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  createRazorpayOrder,
  confirmPayment,
  getAllOrders,
  updateOrderStatus
};