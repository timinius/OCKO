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
        background: 'linear-gradient(135deg, #1A2E1F 0%, #2D5A3D 60%, #3D7A52 100%)',
        color: 'white', padding: '72px 20px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Декоративные круги */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '6px 16px', fontSize: 13, marginBottom: 20, backdropFilter: 'blur(8px)' }}>
            ✨ Тысячи товаров от проверенных продавцов
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 20 }}>
            <img src="/logo-mark-mint.svg" alt="" style={{ width: 56, height: 56 }} />
            <span style={{ color: 'white', fontWeight: 800, fontSize: 48, letterSpacing: '-0.035em', fontFamily: 'Onest, sans-serif', lineHeight: 1 }}>Флипп</span>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 800, marginBottom: 16, letterSpacing: -1, lineHeight: 1.15, fontFamily: 'Onest, sans-serif' }}>
            Покупай и продавай<br />
            <span style={{ color: 'var(--brand-mint)' }}>быстро и выгодно</span>
          </h1>
          <p style={{ fontSize: 17, opacity: 0.8, marginBottom: 40, maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Электроника, одежда, авто, недвижимость — всё в одном месте
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', maxWidth: 580, margin: '0 auto 32px', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
            <input type="text" value={searchVal} onChange={e => setSearchVal(e.target.value)}
              placeholder="Что ищете? iPhone, велосипед, диван..."
              style={{ flex: 1, padding: '18px 22px', border: 'none', fontSize: 15, outline: 'none', color: 'var(--text)' }}
            />
            <button type="submit" style={{
              background: 'var(--primary)', color: 'white', border: 'none', padding: '18px 28px',
              fontWeight: 700, fontSize: 15, cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-dark)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
            >Найти</button>
          </form>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Бесплатные объявления', 'Безопасные сделки', 'Доставка по России'].map(text => (
              <span key={text} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '7px 16px', fontSize: 13, backdropFilter: 'blur(4px)' }}>
                ✓ {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '32px 0' }}>
        <div className="container">
          <h2 className="section-title">Категории</h2>
          <div className="categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {CATEGORIES.map(cat => (
              <Link key={cat.slug} to={`/catalog?category=${cat.slug}`}
                style={{
                  background: 'white', borderRadius: 'var(--radius-lg)', padding: '18px 12px',
                  textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', display: 'block',
                  border: '1.5px solid var(--border)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{cat.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{cat.name}</div>
              </Link>
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
      <section style={{ background: 'linear-gradient(135deg, #1A2E1F 0%, #2D5A3D 100%)', padding: '48px 20px', color: 'white' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>Начните продавать прямо сейчас</h2>
            <p style={{ opacity: 0.75, fontSize: 15 }}>Бесплатное объявление — покупатель найдётся за 24 часа</p>
          </div>
          <Link to="/sell" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary-dark)', fontWeight: 800, fontSize: 15, borderRadius: 14 }}>
            Разместить объявление
          </Link>
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

function PopularProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/products?limit=4&sort=popular').then(r => setProducts(r.data.products || [])).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="spinner" />;
  return <div className="grid-4">{products.map(p => <ProductCard key={p.id} product={p} />)}</div>;
}
