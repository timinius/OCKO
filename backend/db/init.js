const { Database: _Database } = require('node-sqlite3-wasm');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'ocko.db');
let db;

// node-sqlite3-wasm accepts run/get/all with a single value or array,
// but better-sqlite3 allows multiple positional args. This wrapper adds that.
function wrapStmt(stmt) {
  const _run = stmt.run.bind(stmt);
  const _get = stmt.get.bind(stmt);
  const _all = stmt.all.bind(stmt);
  stmt.run = (...args) => _run(args.length <= 1 ? args[0] : args);
  stmt.get = (...args) => _get(args.length <= 1 ? args[0] : args);
  stmt.all = (...args) => _all(args.length <= 1 ? args[0] : args);
  return stmt;
}

function getDB() {
  if (!db) {
    db = new _Database(DB_PATH);
    db.exec('PRAGMA busy_timeout = 10000; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    const _prepare = db.prepare.bind(db);
    db.prepare = (sql) => wrapStmt(_prepare(sql));
  }
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      avatar TEXT,
      city TEXT DEFAULT 'Москва',
      about TEXT,
      rating REAL DEFAULT 0,
      reviews_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category_id INTEGER,
      seller_id INTEGER NOT NULL,
      condition TEXT DEFAULT 'new',
      city TEXT DEFAULT 'Москва',
      views INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (seller_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      address TEXT,
      payment_method TEXT DEFAULT 'card',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reviewer_id INTEGER NOT NULL,
      seller_id INTEGER,
      product_id INTEGER,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reviewer_id) REFERENCES users(id),
      FOREIGN KEY (seller_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(buyer_id, seller_id, product_id),
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (catCount.count === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name, icon, slug) VALUES (?, ?, ?)');
    [
      ['Электроника', '💻', 'electronics'],
      ['Одежда и обувь', '👗', 'clothing'],
      ['Дом и сад', '🏠', 'home'],
      ['Транспорт', '🚗', 'transport'],
      ['Спорт и отдых', '⚽', 'sport'],
      ['Красота и здоровье', '💄', 'beauty'],
      ['Детские товары', '🧸', 'kids'],
      ['Бизнес и оборудование', '🏭', 'business'],
      ['Книги и хобби', '📚', 'books'],
      ['Недвижимость', '🏢', 'realty'],
    ].forEach(c => insertCat.run(...c));

    const hash = bcrypt.hashSync('password123', 10);
    const seller1 = db.prepare(`
      INSERT INTO users (email, password, name, phone, city, about, rating, reviews_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('seller@ocko.ru', hash, 'Алексей Петров', '+7 999 123-45-67', 'Москва',
      'Продаю качественные товары уже 5 лет. Всегда на связи, отвечаю быстро.', 4.8, 127).lastInsertRowid;

    const seller2 = db.prepare(`
      INSERT INTO users (email, password, name, phone, city, about, rating, reviews_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('seller2@ocko.ru', hash, 'Мария Иванова', '+7 985 234-56-78', 'Санкт-Петербург',
      'Продаю одежду и аксессуары. Быстрая доставка по всей России.', 4.6, 89).lastInsertRowid;

    const products = [
      { title: 'iPhone 15 Pro Max 256GB', desc: 'Смартфон в идеальном состоянии. Полный комплект, все документы. Покупал год назад, использовал бережно. Чехол и защитное стекло в подарок. Цвет: Титановый чёрный. Аккумулятор 98%.', price: 89990, cat: 1, seller: seller1, cond: 'used', city: 'Москва' },
      { title: 'MacBook Pro 14" M3 Pro', desc: 'Ноутбук 2024 года, использовался 3 месяца. Состояние отличное, без царапин и потертостей. 18GB RAM, 512GB SSD. В комплекте оригинальное зарядное устройство 96W.', price: 189990, cat: 1, seller: seller1, cond: 'used', city: 'Москва' },
      { title: 'Sony PlayStation 5 Slim', desc: 'PS5 Slim Digital Edition. Куплена 2 месяца назад. В отличном состоянии, использовалась редко. В комплекте 2 джойстика DualSense и зарядная станция.', price: 44990, cat: 1, seller: seller2, cond: 'used', city: 'Санкт-Петербург' },
      { title: 'Куртка зимняя мужская Columbia XL', desc: 'Куртка новая с бирками, не подошел размер. Утеплитель - натуральный пух 80%. Размер XL. Цвет: тёмно-синий. Водонепроницаемая ткань. Капюшон съёмный.', price: 8500, cat: 2, seller: seller2, cond: 'new', city: 'Санкт-Петербург' },
      { title: 'Кроссовки Nike Air Max 270 р.42', desc: 'Кроссовки в отличном состоянии, носил 2 раза. Оригинал, куплены в официальном магазине. Подошва Air Max для максимального комфорта. В коробке.', price: 6990, cat: 2, seller: seller1, cond: 'used', city: 'Москва' },
      { title: 'Диван угловой IKEA VIMLE серый', desc: 'Диван в хорошем состоянии. Цвет: светло-серый. Раскладывается в кровать. Размер: 280x180 см. Самовывоз из Москвы, доставку не организую.', price: 25000, cat: 3, seller: seller1, cond: 'used', city: 'Москва' },
      { title: 'Велосипед горный Scott Aspect 970', desc: 'Горный велосипед 2023 года, размер рамы M (рост 170-180 см). Пробег небольшой, состояние отличное. Тормоза гидравлические Shimano. Вилка SR Suntour.', price: 35000, cat: 5, seller: seller2, cond: 'used', city: 'Санкт-Петербург' },
      { title: 'Детская коляска Bugaboo Fox 5', desc: 'Коляска практически новая, использовалась 4 месяца. Лёгкое складывание одной рукой, большая корзина под сиденьем. В комплекте: дождевик, москитная сетка, бампер.', price: 55000, cat: 7, seller: seller1, cond: 'used', city: 'Москва' },
      { title: 'Apple Watch Series 9 45mm GPS+LTE', desc: 'Смарт-часы в отличном состоянии. GPS + Cellular. Ремешок Alpine Loop зелёный. Зарядное устройство в комплекте. Аккумулятор 95%. Царапин нет.', price: 39990, cat: 1, seller: seller2, cond: 'used', city: 'Санкт-Петербург' },
      { title: 'Фотоаппарат Sony Alpha A7 IV Kit', desc: 'Профессиональный полнокадровый беззеркальный фотоаппарат. Комплект с объективом Sony FE 28-70mm f/3.5-5.6 OSS. Пробег затвора: 2500 кадров. Состояние идеальное.', price: 185000, cat: 1, seller: seller1, cond: 'used', city: 'Москва' },
      { title: 'Платье вечернее красное ZARA, M', desc: 'Красное вечернее платье ZARA, размер M (44 рос.). Надевала один раз на корпоратив. Бренд Zara. Длина миди. Состояние идеальное. Химчистка не нужна.', price: 3500, cat: 2, seller: seller2, cond: 'used', city: 'Санкт-Петербург' },
      { title: 'Кофемашина DeLonghi Magnifica Evo', desc: 'Автоматическая кофемашина с кофемолкой. Куплена год назад, использовалась мало (3-4 чашки в день). Варит отличный кофе. В комплекте молочник для капучино. Чистилась регулярно.', price: 45000, cat: 3, seller: seller1, cond: 'used', city: 'Москва' },
    ];

    const imgUrls = [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600',
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600',
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600',
      'https://images.unsplash.com/photo-1518946222227-364f22132616?w=600',
      'https://images.unsplash.com/photo-1434493907317-a46b5bbe7834?w=600',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600',
    ];

    const extra = [
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
      'https://images.unsplash.com/photo-1612404459794-d09c2d6e20e5?w=600',
      'https://images.unsplash.com/photo-1542298921943-a531b76dca5c?w=600',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
      'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=600',
      'https://images.unsplash.com/photo-1590376862278-df09cdce8bb2?w=600',
    ];

    const insertProduct = db.prepare(`
      INSERT INTO products (title, description, price, category_id, seller_id, condition, city, views, likes_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertImage = db.prepare('INSERT INTO product_images (product_id, url, is_primary) VALUES (?, ?, ?)');

    products.forEach((p, i) => {
      const views = Math.floor(Math.random() * 500) + 50;
      const likes = Math.floor(Math.random() * 50) + 5;
      const prodId = insertProduct.run(p.title, p.desc, p.price, p.cat, p.seller, p.cond, p.city, views, likes).lastInsertRowid;
      insertImage.run(prodId, imgUrls[i % imgUrls.length], 1);
      insertImage.run(prodId, extra[i % extra.length], 0);
      insertImage.run(prodId, imgUrls[(i + 3) % imgUrls.length], 0);
    });

    const insertReview = db.prepare(`
      INSERT INTO reviews (reviewer_id, seller_id, product_id, rating, comment) VALUES (?, ?, ?, ?, ?)
    `);
    insertReview.run(seller2, seller1, 1, 5, 'Отличный продавец! Товар пришел быстро, всё как описано. Рекомендую!');
    insertReview.run(seller2, seller1, 2, 5, 'Очень доволен покупкой. Ноутбук в идеальном состоянии, продавец честный.');
    insertReview.run(seller1, seller2, 3, 4, 'Хорошая сделка. Небольшая задержка с ответом, но всё отлично.');
    insertReview.run(seller1, seller2, 4, 5, 'Товар точно как описан, всё новое. Быстрая доставка, упаковка отличная!');
  }

  console.log('База данных инициализирована');
}

module.exports = { getDB, initDB };
