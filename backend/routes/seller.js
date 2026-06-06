const express = require('express');
const { getDB } = require('../db/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const ORDER_STATUS = {
  pending: 'Новый',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

// Статистика продавца
router.get('/stats', authenticateToken, (req, res) => {
  const db = getDB();
  const sid = req.user.id;
  const stats = {
    active_products: db.prepare("SELECT COUNT(*) as c FROM products WHERE seller_id = ? AND status = 'active'").get(sid).c,
    sold_products: db.prepare("SELECT COUNT(*) as c FROM products WHERE seller_id = ? AND status = 'sold'").get(sid).c,
    total_views: db.prepare('SELECT COALESCE(SUM(views), 0) as s FROM products WHERE seller_id = ?').get(sid).s,
    total_orders: db.prepare('SELECT COUNT(DISTINCT o.id) as c FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id WHERE p.seller_id = ?').get(sid).c,
    total_revenue: db.prepare('SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as s FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE p.seller_id = ?').get(sid).s,
  };
  res.json(stats);
});

// Заказы продавца (заказы, содержащие его товары)
router.get('/orders', authenticateToken, (req, res) => {
  const db = getDB();
  const sid = req.user.id;

  const orders = db.prepare(`
    SELECT DISTINCT o.id, o.status, o.total_price, o.address, o.created_at,
           u.name as buyer_name, u.email as buyer_email, u.phone as buyer_phone
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    JOIN users u ON u.id = o.user_id
    WHERE p.seller_id = ?
    ORDER BY o.created_at DESC
  `).all(sid);

  const result = orders.map(order => {
    const items = db.prepare(`
      SELECT oi.quantity, oi.price, p.id as product_id, p.title as product_title,
             (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ? AND p.seller_id = ?
    `).all(order.id, sid);
    return { ...order, items };
  });

  res.json(result);
});

// Обновить статус заказа
router.patch('/orders/:orderId/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  if (!Object.keys(ORDER_STATUS).includes(status)) {
    return res.status(400).json({ error: 'Неверный статус' });
  }
  const db = getDB();
  // Проверяем что в заказе есть товары этого продавца
  const hasProduct = db.prepare(`
    SELECT 1 FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ? AND p.seller_id = ?
    LIMIT 1
  `).get(req.params.orderId, req.user.id);
  if (!hasProduct) return res.status(403).json({ error: 'Нет доступа к этому заказу' });

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.orderId);
  res.json({ status });
});

module.exports = router;
