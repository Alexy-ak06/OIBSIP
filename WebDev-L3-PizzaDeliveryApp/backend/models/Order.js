const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pizzaConfig: {
      base: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
      sauce: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
      cheese: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
      vegetables: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' }]
    },
    quantity: { type: Number, required: true, default: 1 },
    totalAmount: { type: Number, required: true },
    paymentId: { type: String },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    orderStatus: {
      type: String,
      enum: ['Order Received', 'In Kitchen', 'Sent to Delivery'],
      default: 'Order Received'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);