const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db/init');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { password, name, phone, city } = req.body;
  const email = req.body.email?.trim().toLowerCase();
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, пароль и имя обязательны' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
  }
  const db = getDB();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Email уже зарегистрирован' });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (email, password, name, phone, city) VALUES (?, ?, ?, ?, ?)
  `).run(email, hashed, name, phone || null, city || 'Москва');

  const user = db.prepare('SELECT id, email, name, phone, avatar, city, about, rating, reviews_count, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user });
});

router.post('/login', (req, res) => {
  const { password } = req.body;
  const email = req.body.email?.trim().toLowerCase();
  if (!email || !password) return res.status(400).json({ error: 'Введите email и пароль' });

  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Неверный email или пароль' });

  const { password: _, ...safeUser } = user;
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: safeUser });
});

router.get('/me', authenticateToken, (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT id, email, name, phone, avatar, city, about, rating, reviews_count, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json(user);
});

router.put('/me', authenticateToken, (req, res) => {
  const { name, phone, city, about } = req.body;
  const db = getDB();
  db.prepare('UPDATE users SET name = ?, phone = ?, city = ?, about = ? WHERE id = ?')
    .run(name, phone, city, about, req.user.id);
  const user = db.prepare('SELECT id, email, name, phone, avatar, city, about, rating, reviews_count, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

router.put('/me/password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Введите текущий и новый пароль' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });

  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(401).json({ error: 'Неверный текущий пароль' });
  }
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ message: 'Пароль изменён' });
});

module.exports = router;
