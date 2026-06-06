const express = require('express');
const { getDB } = require('../db/init');

const router = express.Router();

router.get('/:id', (req, res) => {
  const db = getDB();
  const user = db.prepare(`
    SELECT id, name, avatar, city, about, rating, reviews_count, created_at,
           account_type, company_name, company_inn, last_seen FROM users WHERE id = ?
  `).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  const productsCount = db.prepare("SELECT COUNT(*) as cnt FROM products WHERE seller_id = ? AND status = 'active'").get(user.id);
  res.json({ ...user, products_count: productsCount.cnt });
});

module.exports = router;
