const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDB } = require('../db/init');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const uploadDir = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function withImages(product, db) {
  const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC').all(product.id);
  return { ...product, images };
}

router.get('/', optionalAuth, (req, res) => {
  const db = getDB();
  const { search, category, min_price, max_price, condition, city, sort = 'new', page = 1, limit = 20, seller_id, seller_type, status: statusFilter } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Если продавец смотрит свои товары — показываем все статусы, иначе только active
  const defaultStatus = statusFilter || 'active';
  let where = ['p.status = ?'];
  let params = [defaultStatus];

  if (search) { where.push("(JS_LOWER(p.title) LIKE ? OR JS_LOWER(COALESCE(p.description,'')) LIKE ?)"); params.push(`%${search.toLowerCase()}%`); params.push(`%${search.toLowerCase()}%`); }
  if (category) { where.push("c.slug = ?"); params.push(category); }
  if (min_price) { where.push("p.price >= ?"); params.push(parseFloat(min_price)); }
  if (max_price) { where.push("p.price <= ?"); params.push(parseFloat(max_price)); }
  if (condition) { where.push("p.condition = ?"); params.push(condition); }
  if (city) { where.push("p.city LIKE ?"); params.push(`%${city}%`); }
  if (seller_id) { where.push("p.seller_id = ?"); params.push(parseInt(seller_id)); }
  if (seller_type === 'company') { where.push("u.account_type = 'company'"); }
  if (seller_type === 'personal') { where.push("(u.account_type IS NULL OR u.account_type = 'personal')"); }

  const orderMap = { new: 'p.created_at DESC', price_asc: 'p.price ASC', price_desc: 'p.price DESC', popular: 'p.views DESC' };
  const orderBy = orderMap[sort] || 'p.created_at DESC';

  const whereStr = where.join(' AND ');
  const countRow = db.prepare(`
    SELECT COUNT(*) as total FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE ${whereStr}
  `).get(...params);

  const products = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug,
           u.name as seller_name, u.city as seller_city, u.rating as seller_rating,
           u.account_type as seller_account_type, u.company_name as seller_company_name,
           (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE ${whereStr}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ products, total: countRow.total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/:id', optionalAuth, (req, res) => {
  const db = getDB();
  const product = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug,
           u.name as seller_name, u.phone as seller_phone, u.city as seller_city,
           u.rating as seller_rating, u.reviews_count as seller_reviews_count,
           u.about as seller_about, u.avatar as seller_avatar, u.created_at as seller_since,
           u.account_type as seller_account_type, u.company_name as seller_company_name, u.company_inn as seller_company_inn
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!product) return res.status(404).json({ error: 'Товар не найден' });

  db.prepare('UPDATE products SET views = views + 1 WHERE id = ?').run(product.id);
  product.views += 1;

  const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC').all(product.id);
  let is_favorited = false;
  if (req.user) {
    const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?').get(req.user.id, product.id);
    is_favorited = !!fav;
  }

  res.json({ ...product, images, is_favorited });
});

router.post('/', authenticateToken, upload.array('images', 10), (req, res) => {
  const { title, description, price, category_id, condition, city, stock } = req.body;
  if (!title || !price) return res.status(400).json({ error: 'Название и цена обязательны' });

  const db = getDB();
  const result = db.prepare(`
    INSERT INTO products (title, description, price, category_id, seller_id, condition, city, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, parseFloat(price), category_id || null, req.user.id, condition || 'new', city || 'Москва', parseInt(stock) || 1);

  const productId = result.lastInsertRowid;
  const insertImage = db.prepare('INSERT INTO product_images (product_id, url, is_primary) VALUES (?, ?, ?)');

  if (req.files && req.files.length > 0) {
    req.files.forEach((file, i) => {
      insertImage.run(productId, `/uploads/${file.filename}`, i === 0 ? 1 : 0);
    });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  res.status(201).json(withImages(product, db));
});

router.put('/:id', authenticateToken, upload.array('images', 10), (req, res) => {
  const db = getDB();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Товар не найден' });
  if (product.seller_id !== req.user.id) return res.status(403).json({ error: 'Нет доступа' });

  const { title, description, price, category_id, condition, city, stock, status } = req.body;
  db.prepare(`
    UPDATE products SET title = ?, description = ?, price = ?, category_id = ?,
    condition = ?, city = ?, stock = ?, status = ? WHERE id = ?
  `).run(title, description, parseFloat(price), category_id, condition, city, parseInt(stock), status || 'active', product.id);

  // photo_order = JSON array where each item is either a kept existing URL or 'new'
  // 'new' items map to req.files in order; first item in array = primary photo
  const photoOrder = (() => {
    try { return req.body.photo_order ? JSON.parse(req.body.photo_order) : null; } catch { return null; }
  })();

  if (photoOrder !== null) {
    const keepUrls = photoOrder.filter(x => x !== 'new');
    // Delete images not in keep list
    if (keepUrls.length > 0) {
      const placeholders = keepUrls.map(() => '?').join(',');
      db.prepare(`DELETE FROM product_images WHERE product_id = ? AND url NOT IN (${placeholders})`).run(product.id, ...keepUrls);
    } else {
      db.prepare('DELETE FROM product_images WHERE product_id = ?').run(product.id);
    }
    // Reset primary flags
    db.prepare('UPDATE product_images SET is_primary = 0 WHERE product_id = ?').run(product.id);
    // Process order: set primary and insert new files
    const insertImage = db.prepare('INSERT INTO product_images (product_id, url, is_primary) VALUES (?, ?, ?)');
    let newFileIdx = 0;
    photoOrder.forEach((item, i) => {
      if (item === 'new') {
        const file = req.files?.[newFileIdx++];
        if (file) insertImage.run(product.id, `/uploads/${file.filename}`, i === 0 ? 1 : 0);
      } else if (i === 0) {
        db.prepare('UPDATE product_images SET is_primary = 1 WHERE product_id = ? AND url = ?').run(product.id, item);
      }
    });
  } else if (req.files && req.files.length > 0) {
    db.prepare('DELETE FROM product_images WHERE product_id = ?').run(product.id);
    const insertImage = db.prepare('INSERT INTO product_images (product_id, url, is_primary) VALUES (?, ?, ?)');
    req.files.forEach((file, i) => insertImage.run(product.id, `/uploads/${file.filename}`, i === 0 ? 1 : 0));
  }

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(product.id);
  res.json(withImages(updated, db));
});

router.patch('/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  if (!['active', 'sold', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Неверный статус' });
  }
  const db = getDB();
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND seller_id = ?').get(req.params.id, req.user.id);
  if (!product) return res.status(404).json({ error: 'Товар не найден' });
  db.prepare('UPDATE products SET status = ? WHERE id = ?').run(status, product.id);
  res.json({ status });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDB();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Товар не найден' });
  if (product.seller_id !== req.user.id) return res.status(403).json({ error: 'Нет доступа' });
  db.prepare('DELETE FROM products WHERE id = ?').run(product.id);
  res.json({ message: 'Товар удалён' });
});

module.exports = router;
