import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';

const CATEGORIES = [
  { slug: '', name: 'Все категории' },
  { slug: 'electronics', name: '💻 Электроника' },
  { slug: 'clothing', name: '👗 Одежда и обувь' },
  { slug: 'home', name: '🏠 Дом и сад' },
  { slug: 'transport', name: '🚗 Транспорт' },
  { slug: 'sport', name: '⚽ Спорт' },
  { slug: 'beauty', name: '💄 Красота' },
  { slug: 'kids', name: '🧸 Детские товары' },
  { slug: 'books', name: '📚 Книги' },
  { slug: 'business', name: '🏭 Бизнес' },
  { slug: 'realty', name: '🏢 Недвижимость' },
];
const CITIES = ['', 'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород'];
const LIMIT = 20;

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  // search живёт только в URL — читаем напрямую из searchParams, не храним в filters
  const searchQuery = searchParams.get('search') || '';

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    condition: searchParams.get('condition') || '',
    city: searchParams.get('city') || '',
    sort: searchParams.get('sort') || 'new',
    page: parseInt(searchParams.get('page') || '1'),
    seller_type: searchParams.get('seller_type') || '',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      params.set('limit', LIMIT);
      const res = await api.get(`/products?${params}`);
      setProducts(res.data.products);
      setTotal(res.data.total);
    } catch { setProducts([]); } finally { setLoading(false); }
  }, [filters, searchQuery]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const params = {};
    if (searchQuery) params.search = searchQuery;
    Object.entries(filters).forEach(([k, v]) => { if (v && !(k === 'page' && v === 1) && !(k === 'sort' && v === 'new')) params[k] = v; });
    setSearchParams(params, { replace: true });
  }, [filters, searchQuery, setSearchParams]);

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  const resetFilters = () => setFilters({ category: '', min_price: '', max_price: '', condition: '', city: '', sort: 'new', seller_type: '', page: 1 });
  const pages = Math.ceil(total / LIMIT);
  const hasFilters = !!(filters.category || filters.min_price || filters.max_price || filters.condition || filters.city || filters.seller_type);
  const activeFilterCount = [filters.category, filters.min_price || filters.max_price, filters.condition, filters.city, filters.seller_type].filter(Boolean).length;

  const FilterContent = () => (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Тип продавца</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['', 'Все'], ['company', '🏢 Магазины'], ['personal', '👤 Частники']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter('seller_type', val)}
              style={{
                padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: '1.5px solid',
                borderColor: filters.seller_type === val ? 'var(--primary)' : 'var(--border)',
                background: filters.seller_type === val ? 'var(--primary-bg)' : 'white',
                color: filters.seller_type === val ? 'var(--primary-dark)' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Категория</div>
        {CATEGORIES.map(cat => (
          <button key={cat.slug} onClick={() => { setFilter('category', cat.slug); setFilterOpen(false); }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', background: filters.category === cat.slug ? 'var(--primary-bg)' : 'transparent', color: filters.category === cat.slug ? 'var(--primary-dark)' : 'var(--text)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: filters.category === cat.slug ? 700 : 400, marginBottom: 2, transition: 'background 0.15s' }}
            onMouseEnter={e => { if (filters.category !== cat.slug) e.currentTarget.style.background = 'var(--bg)'; }}
            onMouseLeave={e => { if (filters.category !== cat.slug) e.currentTarget.style.background = 'transparent'; }}
          >{cat.name}</button>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Цена, ₽</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" placeholder="От" value={filters.min_price} onChange={e => setFilter('min_price', e.target.value)} className="form-input" style={{ width: '50%', padding: '8px 10px' }}/>
          <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>—</span>
          <input type="number" placeholder="До" value={filters.max_price} onChange={e => setFilter('max_price', e.target.value)} className="form-input" style={{ width: '50%', padding: '8px 10px' }}/>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Состояние</div>
        {[['', 'Любое'], ['new', 'Новый'], ['used', 'Б/у']].map(([val, label]) => (
          <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', cursor: 'pointer', fontSize: 14 }}>
            <input type="radio" name="condition" value={val} checked={filters.condition === val} onChange={() => setFilter('condition', val)} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}/>
            {label}
          </label>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Город</div>
        <select value={filters.city} onChange={e => setFilter('city', e.target.value)} className="form-select" style={{ padding: '8px 10px' }}>
          {CITIES.map(c => <option key={c} value={c}>{c || 'Любой город'}</option>)}
        </select>
      </div>

      {hasFilters && (
        <button onClick={() => { resetFilters(); setFilterOpen(false); }} className="btn btn-ghost" style={{ width: '100%', marginTop: 4 }}>Сбросить фильтры</button>
      )}
    </div>
  );

  return (
    <div className="page">
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/">Главная</Link><span>›</span><span>Каталог</span>
          {filters.search && <><span>›</span><span>«{filters.search}»</span></>}
        </div>

        {/* Mobile filter button */}
        <div style={{ display: 'none', marginBottom: 12 }} className="mobile-filter-btn">
          <button onClick={() => setFilterOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'white', border: '1.5px solid var(--border)', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            Фильтры {activeFilterCount > 0 && <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilterCount}</span>}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }} className="catalog-layout">
          {/* Sidebar Desktop */}
          <aside style={{ width: 228, flexShrink: 0 }} className="catalog-sidebar-desktop">
            <div className="card" style={{ padding: 16 }}><FilterContent /></div>
          </aside>

          {/* Main */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {loading ? 'Загрузка...' : <><strong style={{ color: 'var(--text)' }}>{total}</strong> объявлений</>}
              </div>
              <select value={filters.sort} onChange={e => setFilter('sort', e.target.value)} className="form-select" style={{ padding: '7px 12px', width: 'auto', fontSize: 13 }}>
                <option value="new">Новые</option>
                <option value="price_asc">Дешевле</option>
                <option value="price_desc">Дороже</option>
                <option value="popular">Популярные</option>
              </select>
            </div>

            {loading ? <div className="spinner" /> :
              products.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <h3>Ничего не найдено</h3>
                  <p>Попробуйте изменить параметры поиска</p>
                </div>
              ) : (
                <>
                  <div className="grid-3">
                    {products.map(p => <ProductCard key={p.id} product={p} />)}
                  </div>
                  {pages > 1 && (
                    <div className="pagination">
                      <button className="page-btn" onClick={() => setFilter('page', Math.max(1, filters.page - 1))} disabled={filters.page === 1}>‹</button>
                      {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                        let page;
                        if (pages <= 5) page = i + 1;
                        else if (filters.page <= 3) page = i + 1;
                        else if (filters.page >= pages - 2) page = pages - 4 + i;
                        else page = filters.page - 2 + i;
                        return <button key={page} className={`page-btn ${filters.page === page ? 'active' : ''}`} onClick={() => setFilter('page', page)}>{page}</button>;
                      })}
                      <button className="page-btn" onClick={() => setFilter('page', Math.min(pages, filters.page + 1))} disabled={filters.page === pages}>›</button>
                    </div>
                  )}
                </>
              )
            }
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {filterOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} onClick={() => setFilterOpen(false)} />
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 800, fontSize: 17 }}>Фильтры</span>
              <button onClick={() => setFilterOpen(false)} style={{ background: 'var(--bg)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '16px 20px 24px' }}>
              <FilterContent />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .catalog-sidebar-desktop { display: none; }
          .mobile-filter-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
