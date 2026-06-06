const express = require('express');
const { getDB } = require('../db/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Начать или получить диалог по товару
router.post('/conversations', authenticateToken, (req, res) => {
  const { product_id, seller_id } = req.body;
  const buyer_id = req.user.id;

  if (!product_id || !seller_id) return res.status(400).json({ error: 'product_id и seller_id обязательны' });
  if (buyer_id === seller_id) return res.status(400).json({ error: 'Нельзя написать самому себе' });

  const db = getDB();
  let conv = db.prepare('SELECT * FROM conversations WHERE buyer_id=? AND seller_id=? AND product_id=?')
    .get(buyer_id, seller_id, product_id);

  if (!conv) {
    const result = db.prepare('INSERT INTO conversations (buyer_id, seller_id, product_id) VALUES (?,?,?)')
      .run(buyer_id, seller_id, product_id);
    conv = db.prepare('SELECT * FROM conversations WHERE id=?').get(result.lastInsertRowid);
  }

  res.json(conv);
});

// Список всех диалогов пользователя
router.get('/conversations', authenticateToken, (req, res) => {
  const db = getDB();
  const uid = req.user.id;

  const convs = db.prepare(`
    SELECT
      c.id, c.buyer_id, c.seller_id, c.product_id, c.created_at,
      buyer.name  AS buyer_name, buyer.avatar AS buyer_avatar, buyer.last_seen AS buyer_last_seen,
      seller.name AS seller_name, seller.avatar AS seller_avatar, seller.last_seen AS seller_last_seen,
      p.title     AS product_title,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary=1 LIMIT 1) AS product_image,
      p.price     AS product_price,
      p.status    AS product_status,
      (SELECT text FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
      (SELECT created_at FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
      (SELECT COUNT(*) FROM messages WHERE conversation_id=c.id AND sender_id!=? AND is_read=0) AS unread_count
    FROM conversations c
    JOIN users buyer  ON buyer.id  = c.buyer_id
    JOIN users seller ON seller.id = c.seller_id
    JOIN products p   ON p.id      = c.product_id
    WHERE c.buyer_id=? OR c.seller_id=?
    ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC
  `).all(uid, uid, uid);

  res.json(convs);
});

// Сообщения диалога
router.get('/conversations/:id', authenticateToken, (req, res) => {
  const db = getDB();
  const uid = req.user.id;

  const conv = db.prepare(`
    SELECT c.*,
      buyer.name AS buyer_name, buyer.avatar AS buyer_avatar, buyer.last_seen AS buyer_last_seen,
      seller.name AS seller_name, seller.avatar AS seller_avatar, seller.last_seen AS seller_last_seen,
      p.title AS product_title, p.price AS product_price, p.status AS product_status,
      (SELECT url FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS product_image
    FROM conversations c
    JOIN users buyer  ON buyer.id  = c.buyer_id
    JOIN users seller ON seller.id = c.seller_id
    JOIN products p   ON p.id      = c.product_id
    WHERE c.id=?
  `).get(req.params.id);

  if (!conv) return res.status(404).json({ error: 'Диалог не найден' });
  if (conv.buyer_id !== uid && conv.seller_id !== uid) return res.status(403).json({ error: 'Нет доступа' });

  // Отмечаем сообщения прочитанными
  db.prepare('UPDATE messages SET is_read=1 WHERE conversation_id=? AND sender_id!=?').run(conv.id, uid);

  const messages = db.prepare(`
    SELECT m.*, u.name AS sender_name
    FROM messages m JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id=? ORDER BY m.created_at ASC
  `).all(conv.id);

  res.json({ ...conv, messages });
});

// Отправить сообщение
router.post('/conversations/:id/messages', authenticateToken, (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Сообщение не может быть пустым' });

  const db = getDB();
  const uid = req.user.id;
  const conv = db.prepare('SELECT * FROM conversations WHERE id=?').get(req.params.id);

  if (!conv) return res.status(404).json({ error: 'Диалог не найден' });
  if (conv.buyer_id !== uid && conv.seller_id !== uid) return res.status(403).json({ error: 'Нет доступа' });

  const result = db.prepare('INSERT INTO messages (conversation_id, sender_id, text) VALUES (?,?,?)')
    .run(conv.id, uid, text.trim());

  const msg = db.prepare('SELECT m.*, u.name AS sender_name FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?')
    .get(result.lastInsertRowid);

  res.json(msg);
});

// Количество непрочитанных
router.get('/unread', authenticateToken, (req, res) => {
  const db = getDB();
  const uid = req.user.id;
  const row = db.prepare(`
    SELECT COUNT(*) as count FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE (c.buyer_id=? OR c.seller_id=?) AND m.sender_id!=? AND m.is_read=0
  `).get(uid, uid, uid);
  res.json({ count: row.count });
});

module.exports = router;
