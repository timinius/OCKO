import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get('search') || '');
  }, [location.search]);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/catalog?search=${encodeURIComponent(search.trim())}`);
    else navigate('/catalog');
  };

  const handleLogout = () => { logout(); setMenuOpen(false); navigate('/'); };
  const initials = user ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '';

  return (
    <header style={{
      background: '#1A2E1F',
      color: 'white',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 2px 20px rgba(0,0,0,0.18)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, height: 64 }}>

        {/* Logo */}
        <Link to="/" style={{ color: 'white', fontWeight: 900, fontSize: 24, letterSpacing: -1, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            background: 'var(--primary)', borderRadius: 8, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900,
          }}>Ф</span>
          Флипп
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: 0, maxWidth: 600 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.45 }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск товаров..."
              style={{
                width: '100%', padding: '10px 14px 10px 42px',
                background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)',
                borderRadius: '12px 0 0 12px', fontSize: 14, outline: 'none', color: 'white',
                transition: 'all 0.2s',
              }}
              onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.15)'; e.target.style.borderColor = 'rgba(255,255,255,0.35)'; }}
              onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            />
          </div>
          <button type="submit" style={{
            background: 'var(--primary)', color: 'white', border: 'none',
            borderRadius: '0 12px 12px 0', padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14,
            transition: 'background 0.2s', flexShrink: 0,
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-dark)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
          >Найти</button>
        </form>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavLink to="/catalog">Каталог</NavLink>

          {user && (
            <Link to="/sell" style={{
              color: 'white', background: 'var(--primary)', borderRadius: 10,
              padding: '8px 16px', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
              transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-dark)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'none'; }}
            >
              <span style={{ fontSize: 16 }}>+</span> Продать
            </Link>
          )}

          {user && (
            <IconBtn to="/favorites" title="Избранное">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </IconBtn>
          )}

          <IconBtn to="/cart" title="Корзина" badge={count}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </IconBtn>

          {user ? (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'var(--primary)', border: '2px solid rgba(255,255,255,0.3)',
                color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
              >
                {initials}
              </button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 48, background: 'white', borderRadius: 16,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.16)', minWidth: 210, overflow: 'hidden', zIndex: 200,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ padding: '14px 18px', background: 'var(--primary-bg)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.email}</div>
                  </div>
                  {[
                    { to: '/profile', label: '👤 Мой профиль' },
                    { to: '/profile/listings', label: '📦 Мои объявления' },
                    { to: '/orders', label: '🛍️ Мои заказы' },
                    { to: '/favorites', label: '♡ Избранное' },
                  ].map(item => (
                    <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                      style={{ display: 'block', padding: '11px 18px', color: 'var(--text)', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >{item.label}</Link>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <button onClick={handleLogout} style={{
                      width: '100%', padding: '11px 18px', background: 'none', border: 'none',
                      color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEE8EA'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >Выйти</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" style={{
              background: 'var(--primary)', color: 'white', borderRadius: 10,
              padding: '8px 18px', fontWeight: 700, fontSize: 13,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-dark)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
            >Войти</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({ to, children }) {
  return (
    <Link to={to} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500, padding: '7px 12px', borderRadius: 8, transition: 'all 0.15s', whiteSpace: 'nowrap' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
    >{children}</Link>
  );
}

function IconBtn({ to, children, badge, title }) {
  return (
    <Link to={to} title={title} style={{ color: 'rgba(255,255,255,0.75)', padding: 8, borderRadius: 8, display: 'flex', position: 'relative', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
    >
      {children}
      {badge > 0 && (
        <span style={{
          position: 'absolute', top: 2, right: 2, background: 'var(--accent)', color: 'white',
          borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{badge > 99 ? '99+' : badge}</span>
      )}
    </Link>
  );
}
