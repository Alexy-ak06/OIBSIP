const InventoryItem = require('../models/InventoryItem');

// @route GET /api/admin/inventory
const getAllInventory = async (req, res) => {
  try {
    const items = await InventoryItem.find().sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route PUT /api/admin/inventory/:id
// Manually update stock for one item
const updateStock = async (req, res) => {
  try {
    const { stock, lowStockThreshold } = req.body;

    const item = await InventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (stock !== undefined) item.stock = stock;
    if (lowStockThreshold !== undefined) item.lowStockThreshold = lowStockThreshold;

    await item.save();
    res.json({ message: 'Inventory updated', item });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getAllInventory, updateStock };