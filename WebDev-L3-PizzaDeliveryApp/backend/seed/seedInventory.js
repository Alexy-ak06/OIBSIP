require('dotenv').config();
const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');

const items = [
  // Bases
  { name: 'Classic Hand Tossed', category: 'base', stock: 100, lowStockThreshold: 20 },
  { name: 'Thin Crust', category: 'base', stock: 100, lowStockThreshold: 20 },
  { name: 'Cheese Burst', category: 'base', stock: 100, lowStockThreshold: 20 },
  { name: 'Whole Wheat', category: 'base', stock: 100, lowStockThreshold: 20 },
  { name: 'Gluten Free', category: 'base', stock: 50, lowStockThreshold: 15 },

  // Sauces
  { name: 'Classic Tomato', category: 'sauce', stock: 100, lowStockThreshold: 20 },
  { name: 'Peri Peri', category: 'sauce', stock: 100, lowStockThreshold: 20 },
  { name: 'BBQ', category: 'sauce', stock: 100, lowStockThreshold: 20 },
  { name: 'White Garlic', category: 'sauce', stock: 100, lowStockThreshold: 20 },
  { name: 'Pesto', category: 'sauce', stock: 60, lowStockThreshold: 15 },

  // Cheeses
  { name: 'Mozzarella', category: 'cheese', stock: 100, lowStockThreshold: 20 },
  { name: 'Cheddar', category: 'cheese', stock: 80, lowStockThreshold: 20 },
  { name: 'Vegan Cheese', category: 'cheese', stock: 40, lowStockThreshold: 15 },

  // Vegetables
  { name: 'Onion', category: 'vegetable', stock: 100, lowStockThreshold: 20 },
  { name: 'Capsicum', category: 'vegetable', stock: 100, lowStockThreshold: 20 },
  { name: 'Mushroom', category: 'vegetable', stock: 100, lowStockThreshold: 20 },
  { name: 'Olives', category: 'vegetable', stock: 80, lowStockThreshold: 20 },
  { name: 'Corn', category: 'vegetable', stock: 100, lowStockThreshold: 20 },
  { name: 'Jalapeno', category: 'vegetable', stock: 70, lowStockThreshold: 20 },
  { name: 'Tomato', category: 'vegetable', stock: 100, lowStockThreshold: 20 }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    await InventoryItem.deleteMany({});
    console.log('Cleared existing inventory items');

    await InventoryItem.insertMany(items);
    console.log(`Seeded ${items.length} inventory items successfully`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
};

seed();