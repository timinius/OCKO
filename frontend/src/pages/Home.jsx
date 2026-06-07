import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';

const CATEGORIES = [
  { slug: 'electronics', name: 'Электроника', icon: '💻' },
  { slug: 'clothing', name: 'Одежда и обувь', icon: '👗' },
  { slug: 'home', name: 'Дом и сад', icon: '🏠' },
  { slug: 'transport', name: 'Транспорт', icon: '🚗' },
  { slug: 'sport', name: 'Спорт', icon: '⚽' },
  { slug: 'beauty', name: 'Красота', icon: '💄' },
  { slug: 'kids', name: 'Дети', icon: '🧸' },
  { slug: 'books', name: 'Книги', icon: '📚' },
  { slug: 'business', name: 'Бизнес', icon: '🏭' },
  { slug: 'realty', name: 'Недвижимость', icon: '🏢' },
];

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    api.get('/products?limit=8&sort=new').then(r => setProducts(r.data.products || [])).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) navigate(`/catalog?search=${encodeURIComponent(searchVal.trim())}`);
    else navigate('/catalog');
  };

  return (
    <div>
      {/* Hero */}
      <div style={{ padding: '8px 12px 0', maxWidth: 1264, margin: '0 auto' }}>
      <section style={{
        background: 'linear-gradient(145deg, #0F2318 0%, #1A3A27 45%, #243F2E 100%)',
        color: 'white', padding: '0px 52px 0px',
        position: 'relative', overflow: 'hidden', borderRadius: 16,
      }}>
        <div style={{ position: 'absolute', top: -120, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(142,211,168,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(54,133,90,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 48 }}>
          {/* Left: text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(142,211,168,0.12)', border: '1px solid rgba(142,211,168,0.2)', borderRadius: 100, padding: '6px 16px', fontSize: 13, marginBottom: 26, backdropFilter: 'blur(12px)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-mint)', display: 'inline-block' }} />
              Тысячи товаров от проверенных продавцов
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 14, letterSpacing: -0.8, lineHeight: 1.13 }}>
              Покупай и продавай<br />
              <span style={{ color: 'var(--brand-mint)' }}>быстро и выгодно</span>
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 30, lineHeight: 1.65, maxWidth: 360 }}>
              Электроника, одежда, авто — всё в одном месте
            </p>

            <form onSubmit={handleSearch} style={{ display: 'flex', maxWidth: 460, marginBottom: 0px, borderRadius: 100, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.32)', background: 'white' }}>
              <svg style={{ flexShrink: 0, margin: 'auto 0 auto 18px', opacity: 0.35 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D1A11" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" value={searchVal} onChange={e => setSearchVal(e.target.value)}
                placeholder="iPhone, велосипед, диван..."
                style={{ flex: 1, padding: '15px 14px', border: 'none', fontSize: 14, outline: 'none', color: 'var(--text)', background: 'transparent', minWidth: 0 }}
              />
              <button type="submit"
                style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '15px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', flexShrink: 0, borderRadius: 100, margin: 4, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-dark)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
              >Найти</button>
            </form>

          </div>

          {/* Right: animated cards */}
          <div className="hero-cards-col" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HeroCards />
          </div>
        </div>
      </section>
      </div>

      {/* Categories */}
      <section style={{ padding: '40px 0' }}>
        <div className="container">
          <h2 className="section-title">Категории</h2>
          <div className="categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {CATEGORIES.map(cat => (
              <CategoryCard key={cat.slug} cat={cat} />
            ))}
          </div>
        </div>
      </section>

      {/* New listings */}
      <section style={{ padding: '0 0 48px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Новые объявления</h2>
            <Link to="/catalog" style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 700 }}>Смотреть все →</Link>
          </div>
          {loading ? <div className="spinner" /> : products.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📦</div><h3>Пока нет объявлений</h3></div>
          ) : (
            <div className="grid-4">{products.map(p => <ProductCard key={p.id} product={p} />)}</div>
          )}
        </div>
      </section>

      {/* Banner CTA */}
      <section style={{ padding: '0 20px 48px' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, #0F2318 0%, #1D3D2A 60%, #2A5238 100%)',
            borderRadius: 24, padding: '48px 48px', color: 'white', position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24,
          }}>
            <div style={{ position: 'absolute', top: -60, right: 80, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(142,211,168,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-mint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Продавцам</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5, lineHeight: 1.2 }}>Начните продавать прямо сейчас</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.6 }}>Бесплатное объявление — покупатель найдётся за 24 часа</p>
            </div>
            <Link to="/sell" style={{
              background: 'white', color: 'var(--primary-dark)', fontWeight: 800, fontSize: 15,
              padding: '16px 32px', borderRadius: 100, whiteSpace: 'nowrap', display: 'inline-flex',
              alignItems: 'center', gap: 8, transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              flexShrink: 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)'; }}
            >
              Разместить объявление →
            </Link>
          </div>
        </div>
      </section>

      {/* Popular */}
      <section style={{ padding: '40px 0 48px' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Популярное</h2>
            <Link to="/catalog?sort=popular" style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 700 }}>Смотреть все →</Link>
          </div>
          <PopularProducts />
        </div>
      </section>
    </div>
  );
}

const HERO_CARDS = [
  { img: '/hero/sneakers.jpg', name: 'Кроссовки',   price: '6 990 ₽',   badge: 'Новый' },
  { img: '/hero/laptop.jpg',   name: 'Ноутбук',     price: '89 990 ₽',  badge: 'Б/у'   },
  { img: '/hero/sofa.jpg',     name: 'Диван',       price: '25 000 ₽',  badge: 'Б/у'   },
  { img: '/hero/bicycle.jpg',  name: 'Велосипед',   price: '35 000 ₽',  badge: 'Б/у'   },
  { img: '/hero/camera.jpg',   name: 'Фотоаппарат', price: '67 500 ₽',  badge: 'Новый' },
  { img: '/hero/phone.jpg',    name: 'Смартфон',    price: '49 990 ₽',  badge: 'Б/у'   },
  { img: '/hero/console.jpg',  name: 'Приставка',   price: '44 990 ₽',  badge: 'Б/у'   },
];

// N=7: pos 0=центр, 1=ближняя правая, 2=дальняя правая, 3=скрытая правая,
//       4=скрытая левая, 5=дальняя левая, 6=ближняя левая
const CPOS = {
  0: { x:    0, ry:   0, s: 1.00, o: 1.00, z: 7 },
  1: { x:  158, ry: -22, s: 0.80, o: 0.85, z: 6 },
  2: { x:  292, ry: -40, s: 0.63, o: 0.65, z: 5 },
  3: { x:  410, ry: -55, s: 0.50, o: 0.00, z: 4 },
  4: { x: -410, ry:  55, s: 0.50, o: 0.00, z: 4 },
  5: { x: -292, ry:  40, s: 0.63, o: 0.65, z: 5 },
  6: { x: -158, ry:  22, s: 0.80, o: 0.85, z: 6 },
};
const N_HC = HERO_CARDS.length;
const HIDDEN = new Set([3, 4]);

function HeroCards() {
  const [active, setActive] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive(a => { prevRef.current = a; return (a + 1) % N_HC; });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      position: 'relative', width: 720, height: 340,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      perspective: '1000px',
    }}>
      {HERO_CARDS.map((card, i) => {
        const pos = (i - active + N_HC) % N_HC;
        const prevPos = (i - prevRef.current + N_HC) % N_HC;
        const p = CPOS[pos];
        const isCenter = pos === 0;
        // Оба скрытые → телепорт без анимации (невидимые)
        const noAnim = HIDDEN.has(pos) && HIDDEN.has(prevPos);
        const TRANS = 'transform 0.75s cubic-bezier(0.4,0,0.2,1), opacity 0.65s ease';

        return (
          <div key={card.name} style={{
            position: 'absolute', width: 158,
            transform: `translateX(${p.x}px) rotateY(${p.ry}deg) scale(${p.s})`,
            opacity: p.o,
            zIndex: p.z,
            transformOrigin: 'center center',
            transition: noAnim ? 'none' : TRANS,
          }}>
            {/* Белое свечение за центральной карточкой */}
            <div style={{
              position: 'absolute', inset: -12, borderRadius: 26,
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.12) 0%, transparent 70%)',
              opacity: isCenter ? 1 : 0,
              transition: 'opacity 0.65s ease',
              pointerEvents: 'none',
            }} />
            {/* Сама карточка */}
            <div style={{
              background: 'white', borderRadius: 14, overflow: 'hidden',
              boxShadow: isCenter
                ? '0 0 0 1.5px rgba(255,255,255,0.22), 0 0 36px rgba(255,255,255,0.18), 0 24px 56px rgba(0,0,0,0.46)'
                : '0 8px 26px rgba(0,0,0,0.24)',
              transition: 'box-shadow 0.75s ease',
            }}>
              <div style={{ height: 152, overflow: 'hidden', background: '#eee' }}>
                <img src={card.img} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0D1A11', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#36855A' }}>{card.price}</div>
                  <span style={{ fontSize: 10, background: '#EEF7F2', color: '#36855A', padding: '2px 7px', borderRadius: 100, fontWeight: 700 }}>{card.badge}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CategoryCard({ cat }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link to={`/catalog?category=${cat.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white', borderRadius: 16, padding: '20px 12px 16px',
        textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered
          ? '0 12px 36px rgba(54,133,90,0.18)'
          : '0 1px 3px rgba(0,0,0,0.05), 0 2px 12px rgba(0,0,0,0.05)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease',
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 16, fontSize: 26,
        background: hovered ? 'var(--primary-bg)' : '#F3F6F4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s',
      }}>{cat.icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{cat.name}</div>
    </Link>
  );
}

function PopularProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/products?limit=4&sort=popular').then(r => setProducts(r.data.products || [])).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="spinner" />;
  return <div className="grid-4">{products.map(p => <ProductCard key={p.id} product={p} />)}</div>;
}
