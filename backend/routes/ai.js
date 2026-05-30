const express = require('express');
const Groq = require('groq-sdk');
const { getDB } = require('../db/init');

const router = express.Router();

function formatPrice(p) {
  return new Intl.NumberFormat('ru-RU').format(p) + ' ₽';
}

const SYSTEM_PROMPT = `Ты — умный помощник по подбору товаров на маркетплейсе OCKO.

Твоя задача: понять что нужно пользователю и порекомендовать ТОЛЬКО подходящие товары из предоставленного списка.

ВАЖНЫЕ ПРАВИЛА:
1. Отвечай ТОЛЬКО на русском языке
2. Рекомендуй ТОЛЬКО те товары из списка, которые реально подходят под запрос. Если товар не имеет отношения к запросу — НЕ упоминай его вообще
3. Если в списке нет подходящих товаров — честно скажи об этом и предложи поискать иначе. Не придумывай и не предлагай нерелевантное
4. Если запрос косвенный («хочу заниматься танцами») — подумай что нужно для этого (обувь, одежда) и порекомендуй только это из списка
5. На вопросы НЕ о товарах отвечай ТОЛЬКО: «Я помогаю с подбором товаров на OCKO. Что ищете?»
6. Отвечай кратко — 2-3 предложения максимум

ПРИМЕР ПРАВИЛЬНОГО ПОВЕДЕНИЯ:
- Запрос «бальные танцы» → рекомендуй только обувь/одежду из списка, диваны и телефоны — игнорируй
- Запрос «хочу похудеть» → рекомендуй только спорттовары, остальное — игнорируй`;

// Синонимы и переводы для расширения поиска
const SYNONYMS = {
  'ноутбук': ['ноутбук', 'laptop', 'macbook', 'lenovo', 'asus', 'dell', 'hp'],
  'телефон': ['телефон', 'смартфон', 'iphone', 'samsung', 'xiaomi', 'android'],
  'смартфон': ['смартфон', 'телефон', 'iphone', 'samsung', 'android'],
  'наушник': ['наушник', 'airpods', 'гарнитур'],
  'часы': ['часы', 'watch', 'apple watch'],
  'планшет': ['планшет', 'ipad', 'tablet'],
  'велосипед': ['велосипед', 'байк', 'велик'],
  'кроссовк': ['кроссовк', 'кеды', 'nike', 'adidas', 'puma'],
  'куртк': ['куртк', 'пальто', 'пуховик', 'ветровк'],
  'диван': ['диван', 'кресло', 'мягк', 'мебель'],
  'фотоаппарат': ['фотоаппарат', 'камер', 'sony', 'canon', 'nikon'],
  'игровой': ['игровой', 'playstation', 'xbox', 'nintendo', 'ps5'],
  'коляск': ['коляск', 'bugaboo', 'детск'],
  'кофемашин': ['кофемашин', 'кофеварк', 'delonghi', 'кофе'],
};

// Обрезаем окончания для поиска по основе слова
function getSearchVariants(word) {
  const variants = new Set([word]);
  // Ищем по первым N символам (стемминг)
  if (word.length > 5) variants.add(word.slice(0, -1));
  if (word.length > 6) variants.add(word.slice(0, -2));
  if (word.length > 7) variants.add(word.slice(0, -3));
  // Добавляем синонимы
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (word.includes(key) || key.includes(word.slice(0, -2))) {
      syns.forEach(s => variants.add(s));
    }
  }
  return [...variants];
}

function searchProducts(query, db) {
  const rawWords = query.toLowerCase()
    .replace(/[^\wа-яёa-z\s]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  if (rawWords.length === 0) {
    return db.prepare(`
      SELECT p.id, p.title, p.price, p.city, p.condition,
             c.name as category_name,
             (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active' ORDER BY p.views DESC LIMIT 6
    `).all();
  }

  // Расширяем каждое слово вариантами и синонимами
  const allTerms = [...new Set(rawWords.flatMap(w => getSearchVariants(w)))];

  // LOWER() нужен для кириллицы — SQLite чувствителен к регистру у не-ASCII символов
  const clause = "(LOWER(p.title) LIKE ? OR LOWER(COALESCE(p.description,'')) LIKE ? OR LOWER(c.name) LIKE ?)";
  const clauses = allTerms.map(() => clause).join(' OR ');
  const params = allTerms.flatMap(w => [`%${w}%`, `%${w}%`, `%${w}%`]);

  const results = db.prepare(`
    SELECT p.id, p.title, p.price, p.city, p.condition, p.description,
           c.name as category_name,
           u.name as seller_name, u.rating as seller_rating,
           (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.status = 'active' AND (${clauses})
    ORDER BY p.views DESC LIMIT 8
  `).all(...params);

  return results.slice(0, 8);
}

router.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Сообщение пустое' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GROQ_API_KEY не настроен в переменных окружения Railway' });
  }

  try {
    const db = getDB();
    const products = searchProducts(message, db);

    const productContext = products.length > 0
      ? '\n\nДОСТУПНЫЕ ТОВАРЫ:\n' +
        products.map(p =>
          `[ID:${p.id}] "${p.title}" — ${formatPrice(p.price)} | ${p.condition === 'new' ? 'Новый' : 'Б/у'} | ${p.city}${p.description ? ' | ' + p.description.slice(0, 80) : ''}`
        ).join('\n') +
        '\n\nВ КОНЦЕ ответа обязательно добавь строку: RECOMMENDED_IDS:[id1,id2,...] — перечисли ID только тех товаров которые реально подходят под запрос. Если подходящих нет — RECOMMENDED_IDS:[]'
      : '\n\nТовары по запросу не найдены. Сообщи об этом и предложи поискать иначе. Добавь: RECOMMENDED_IDS:[]';

    const groq = new Groq({ apiKey });

    const messages = [
      ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 600,
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + productContext },
        ...messages,
      ],
    });

    const rawReply = response.choices[0]?.message?.content || '';

    // Извлекаем рекомендованные ID и убираем служебную строку из ответа
    const idMatch = rawReply.match(/RECOMMENDED_IDS:\[([^\]]*)\]/);
    const recommendedIds = idMatch && idMatch[1]
      ? idMatch[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
      : [];
    const reply = rawReply.replace(/\n?RECOMMENDED_IDS:\[[^\]]*\]/g, '').trim();

    // Показываем только рекомендованные карточки
    const recommendedProducts = recommendedIds.length > 0
      ? products.filter(p => recommendedIds.includes(p.id))
      : [];

    res.json({ reply, products: recommendedProducts });

  } catch (e) {
    console.error('Groq error:', e.message);
    res.status(500).json({ error: 'Ошибка AI: ' + e.message });
  }
});

module.exports = router;
