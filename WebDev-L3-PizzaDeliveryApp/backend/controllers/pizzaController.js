const InventoryItem = require('../models/InventoryItem');

// @route GET /api/pizza/catalog
// Returns all in-stock items grouped by category
const getCatalog = async (req, res) => {
  try {
    const items = await InventoryItem.find({ stock: { $gt: 0 } });

    const catalog = {
      bases: items.filter((i) => i.category === 'base'),
      sauces: items.filter((i) => i.category === 'sauce'),
      cheeses: items.filter((i) => i.category === 'cheese'),
      vegetables: items.filter((i) => i.category === 'vegetable')
    };

    res.json(catalog);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getCatalog };