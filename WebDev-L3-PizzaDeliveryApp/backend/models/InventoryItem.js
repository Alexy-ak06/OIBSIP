const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['base', 'sauce', 'cheese', 'vegetable']
    },
    stock: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, required: true, default: 20 },
    lastAlertSentAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);