const express = require('express');
const { getDB } = require('../db/init');

const router = express.Router();

function formatPrice(p) {
  return new Intl.NumberFormat('ru-RU').format(p) + ' ₽';
}

// Категории и их синонимы для распознавания запроса
const CATEGORY_KEYWORDS = {
  electronics:  ['телефон', 'смартфон', 'ноутбук', 'компьютер', 'планшет', 'часы', 'наушники', 'камера', 'фото', 'игровая', 'playstation', 'xbox', 'iphone', 'samsung', 'apple', 'mac', 'электроник', 'гаджет', 'зарядк'],
  clothing:     ['одежда', 'куртк', 'пальто', 'платье', 'костюм', 'джинс', 'футболк', 'кроссовк', 'обувь', 'ботинк', 'кеды', 'сапог', 'шапк', 'перчатк', 'носк', 'свитер', 'худи'],
  home:         ['диван', 'кресло', 'стол', 'стул', 'шкаф', 'кровать', 'матрас', 'холодильник', 'стиральн', 'посуда', 'кастрюл', 'сковород', 'пылесос', 'кофемашин', 'мебель', 'светильник', 'ламп', 'дом', 'сад', 'огород'],
  transport:    ['машина', 'автомобиль', 'мотоцикл', 'велосипед', 'самокат', 'скутер', 'авто', 'транспорт'],
  sport:        ['спорт', 'фитнес', 'тренажер', 'гантел', 'штанг', 'мяч', 'ракетк', 'велосипед', 'лыж', 'сноуборд', 'палатк', 'туризм', 'рюкзак'],
  beauty:       ['крем', 'парфюм', 'духи', 'косметик', 'уход', 'шампунь', 'маск', 'красота', 'здоровье', 'витамин'],
  kids:         ['детск', 'игрушк', 'коляск', 'кроватк', 'ребенок', 'малыш', 'школ', 'рюкзак', 'конструктор', 'кукл', 'машинк'],
  books:        ['книг', 'учебник', 'литератур', 'роман', 'хобби', 'настольн', 'игр'],
  business:     ['бизнес', 'оборудован', 'станок', 'инструмент', 'офис', 'принтер'],
  realty:       ['квартир', 'комнат', 'дом', 'недвижимост', 'участок', 'дач'],
};

const CONDITION_KEYWORDS = {
  new:  ['новый', 'новая', 'новое', 'новые', 'запечатан', 'не открыв'],
  used: ['бу', 'б/у', 'подержан', 'использован', 'второй рук'],
};

function parseQuery(text) {
  const lower = text.toLowerCase();

  // Цена
  let maxPrice = null, minPrice = null;
  const upTo = lower.match(/до\s+([\d\s]+)\s*[рр₽]|не\s+дороже\s+([\d\s]+)|бюджет\s+([\d\s]+)/);
  if (upTo) {
    const num = (upTo[1] || upTo[2] || upTo[3]).replace(/\s/g, '');
    maxPrice = parseInt(num);
  }
  const from = lower.match(/от\s+([\d\s]+)\s*[рр₽]/);
  if (from) minPrice = parseInt(from[1].replace(/\s/g, ''));

  // Категория
  let category = null;
  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      category = slug;
      break;
    }
  }

  // Состояние
  let condition = null;
  if (CONDITION_KEYWORDS.new.some(kw => lower.includes(kw))) condition = 'new';
  else if (CONDITION_KEYWORDS.used.some(kw => lower.includes(kw))) condition = 'used';

  // Ключевые слова
  const stopWords = new Set(['что', 'есть', 'ищу', 'хочу', 'найди', 'покажи', 'мне', 'для', 'по', 'на', 'до', 'от', 'за', 'под', 'как', 'какой', 'какая', 'какие', 'нужен', 'нужна', 'нужно', 'посоветуй', 'подбери', 'порекомендуй', 'хороший', 'хорошая', 'хорошие', 'дешевый', 'дешевле', 'дороже', 'самый', 'лучший', 'купить', 'продать']);
  const keywords = lower.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w) && !/^\d+$/.test(w));

  return { keywords, category, maxPrice, minPrice, condition };
}

function searchProducts(parsed, db) {
  const { keywords, category, maxPrice, minPrice, condition } = parsed;

  const where = ['p.status = ?'];
  const params = ['active'];

  if (category) { where.push('c.slug = ?'); params.push(category); }
  if (maxPrice) { where.push('p.price <= ?'); params.push(maxPrice); }
  if (minPrice) { where.push('p.price >= ?'); params.push(minPrice); }
  if (condition) { where.push('p.condition = ?'); params.push(condition); }

  if (keywords.length > 0) {
    const kw = keywords.map(() => '(p.title LIKE ? OR p.description LIKE ?)').join(' OR ');
    where.push(`(${kw})`);
    keywords.forEach(k => { params.push(`%${k}%`); params.push(`%${k}%`); });
  }

  return db.prepare(`
    SELECT p.id, p.title, p.price, p.city, p.condition, p.description, p.views,
           c.name as category_name, c.slug as category_slug,
           u.name as seller_name, u.rating as seller_rating,
           (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE ${where.join(' AND ')}
    ORDER BY p.views DESC, p.likes_count DESC
    LIMIT 8
  `).all(...params);
}

function buildReply(text, products, parsed) {
  const lower = text.toLowerCase();

  if (products.length === 0) {
    const tips = [];
    if (parsed.maxPrice) tips.push(`бюджет ${formatPrice(parsed.maxPrice)}`);
    if (parsed.condition) tips.push(parsed.condition === 'new' ? 'новые товары' : 'б/у товары');
    return `😔 По запросу «${text}» ничего не нашлось${tips.length ? ` (${tips.join(', ')})` : ''}.\n\nПопробуйте:\n• Изменить формулировку\n• Убрать ограничения по цене\n• Поискать по другой категории`;
  }

  const priceRange = products.length > 1
    ? `от ${formatPrice(Math.min(...products.map(p => p.price)))} до ${formatPrice(Math.max(...products.map(p => p.price)))}`
    : formatPrice(products[0].price);

  let intro = '';
  if (lower.includes('посоветуй') || lower.includes('порекомендуй') || lower.includes('подбери')) {
    intro = `✨ Вот что я подобрал специально для вас — ${products.length} вариант${products.length > 1 ? 'а' : ''}`;
  } else if (lower.includes('дешев') || lower.includes('бюджет') || lower.includes('до ')) {
    intro = `💰 Нашёл ${products.length} товар${products.length > 1 ? 'а' : ''} по выгодной цене`;
  } else {
    intro = `🔍 Нашёл ${products.length} товар${products.length > 1 ? 'а' : ''} по вашему запросу`;
  }

  intro += `, цены ${priceRange}.\n\n`;

  if (products.length > 0) {
    const top = products[0];
    intro += `⭐ Самый популярный: **${top.title}** — ${formatPrice(top.price)}`;
    if (top.seller_rating > 0) intro += `, продавец ${top.seller_rating}★`;
    intro += '.\n\n';
  }

  if (parsed.maxPrice && products.some(p => p.price < parsed.maxPrice * 0.7)) {
    intro += `💡 Несколько вариантов значительно дешевле вашего бюджета!\n\n`;
  }

  intro += `Нажмите на карточку товара чтобы узнать подробности.`;
  return intro;
}

router.post('/chat', (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Сообщение пустое' });

  const lower = message.toLowerCase().trim();

  // Проверка что вопрос о товарах
  const offTopicPhrases = ['как дела', 'привет', 'погода', 'политика', 'напиши код', 'помоги с', 'объясни', 'расскажи про', 'что такое', 'кто такой', 'история', 'математика', 'переведи'];
  const isOffTopic = offTopicPhrases.some(p => lower.includes(p)) && !lower.includes('товар') && !lower.includes('купить') && !lower.includes('продает') && !lower.includes('цен');

  if (isOffTopic) {
    return res.json({
      reply: '🛍️ Я помогаю только с подбором товаров на OCKO!\n\nСкажите что ищете — и я найду подходящие варианты. Например:\n• «Ищу ноутбук до 80 000 ₽»\n• «Детские игрушки»\n• «Новый велосипед»',
      products: [],
    });
  }

  try {
    const db = getDB();
    const parsed = parseQuery(message);
    const products = searchProducts(parsed, db);
    const reply = buildReply(message, products, parsed);
    res.json({ reply, products: products.slice(0, 4) });
  } catch (e) {
    console.error('AI search error:', e);
    res.status(500).json({ error: 'Ошибка поиска' });
  }
});

module.exports = router;
