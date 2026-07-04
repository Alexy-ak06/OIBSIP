const cron = require('node-cron');
const InventoryItem = require('../models/InventoryItem');
const sendEmail = require('../utils/sendEmail');

// Avoid spamming: only re-alert for an item once every 6 hours
const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000;

const checkLowStock = async () => {
  try {
    const lowStockItems = await InventoryItem.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    });

    if (lowStockItems.length === 0) {
      console.log('[Stock Check] All inventory levels healthy.');
      return;
    }

    const itemsToAlert = lowStockItems.filter((item) => {
      if (!item.lastAlertSentAt) return true;
      return Date.now() - new Date(item.lastAlertSentAt).getTime() > ALERT_COOLDOWN_MS;
    });

    if (itemsToAlert.length === 0) {
      console.log('[Stock Check] Low stock items exist but were alerted recently.');
      return;
    }

    const listHtml = itemsToAlert
      .map(
        (item) =>
          `<li><strong>${item.name}</strong> (${item.category}) — Stock: ${item.stock} (threshold: ${item.lowStockThreshold})</li>`
      )
      .join('');

    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: `⚠️ Low Stock Alert — ${itemsToAlert.length} item(s) below threshold`,
      html: `
        <p>The following inventory items are running low:</p>
        <ul>${listHtml}</ul>
        <p>Please restock soon.</p>
      `
    });

    for (const item of itemsToAlert) {
      item.lastAlertSentAt = new Date();
      await item.save();
    }

    console.log(`[Stock Check] Alert email sent for ${itemsToAlert.length} item(s).`);
  } catch (err) {
    console.error('[Stock Check] Error checking low stock:', err.message);
  }
};

const startLowStockCron = () => {
  const schedule = process.env.STOCK_CHECK_CRON || '0 * * * *'; // default: every hour
  cron.schedule(schedule, () => {
    console.log('[Stock Check] Running scheduled low-stock check...');
    checkLowStock();
  });
  console.log(`[Stock Check] Cron job scheduled: ${schedule}`);
};

module.exports = { startLowStockCron, checkLowStock };