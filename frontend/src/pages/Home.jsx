import { useState, useEffect } from 'react';
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
      <section style={{
        background: 'linear-gradient(145deg, #0F2318 0%, #1A3A27 45%, #243F2E 100%)',
        color: 'white', padding: '80px 20px 88px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Декоративные элементы */}
        <div style={{ position: 'absolute', top: -120, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(142,211,168,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(54,133,90,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: '10%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(142,211,168,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative' }}>
          {/* Pill badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(142,211,168,0.12)', border: '1px solid rgba(142,211,168,0.2)', borderRadius: 100, padding: '6px 16px', fontSize: 13, marginBottom: 28, backdropFilter: 'blur(12px)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-mint)', display: 'inline-block' }} />
            Тысячи товаров от проверенных продавцов
          </div>

          {/* Logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
            <img src="/logo-mark-mint.svg" alt="" style={{ width: 60, height: 60, filter: 'drop-shadow(0 0 24px rgba(142,211,168,0.4))' }} />
            <span style={{ color: 'white', fontWeight: 800, fontSize: 52, letterSpacing: '-0.04em', fontFamily: 'Onest, sans-serif', lineHeight: 1 }}>Флип</span>
          </div>

          <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16, letterSpacing: -1, lineHeight: 1.12, maxWidth: 560, margin: '0 auto 16px' }}>
            Покупай и продавай<br />
            <span style={{ color: 'var(--brand-mint)' }}>быстро и выгодно</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.62)', marginBottom: 40, maxWidth: 420, margin: '0 auto 40px', lineHeight: 1.65 }}>
            Электроника, одежда, авто — всё в одном месте
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', maxWidth: 600, margin: '0 auto 36px', borderRadius: 100, overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2)', background: 'white' }}>
            <svg style={{ flexShrink: 0, margin: 'auto 0 auto 20px', opacity: 0.35 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D1A11" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" value={searchVal} onChange={e => setSearchVal(e.target.value)}
              placeholder="Что ищете? iPhone, велосипед, диван..."
              style={{ flex: 1, padding: '18px 16px', border: 'none', fontSize: 15, outline: 'none', color: 'var(--text)', background: 'transparent', minWidth: 0 }}
            />
            <button type="submit" className="hero-search-btn"
              style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '18px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: 6, borderRadius: '0 100px 100px 0', margin: 4, borderRadius: 100 }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-dark)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
            >
              <svg className="hero-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span className="hero-search-text">Найти</span>
            </button>
          </form>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['✓', 'Бесплатно'], ['✓', 'Безопасно'], ['✓', 'Доставка по России']].map(([icon, text]) => (
              <span key={text} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '7px 16px', fontSize: 13, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--brand-mint)', fontWeight: 700 }}>{icon}</span> {text}
              </span>
            ))}
          </div>
        </div>
      </section>

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
