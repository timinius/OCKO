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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const menuRef = useRef(null);
  const inputFocusedRef = useRef(false);

  useEffect(() => {
    // Don't override input while user is actively typing
    if (!inputFocusedRef.current) {
      const params = new URLSearchParams(location.search);
      setSearch(params.get('search') || '');
    }
  }, [location.search]);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!user) return;
    const load = () => import('../api/client').then(m => m.default.get('/chat/unread').then(r => setUnreadChats(r.data.count)).catch(() => {}));
    load();
    const interval = setInterval(load, 30000);
    // Refresh immediately when messages are read in Chats page
    const onRead = () => setTimeout(load, 400);
    window.addEventListener('chatMessagesRead', onRead);
    return () => {
      clearInterval(interval);
      window.removeEventListener('chatMessagesRead', onRead);
    };
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/catalog?search=${encodeURIComponent(search.trim())}`);
    else navigate('/catalog');
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const handleLogout = () => { logout(); setMenuOpen(false); setMobileOpen(false); navigate('/'); };
  const initials = user ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '';

  return (
    <>
      <header style={{ background: '#1A2E1F', color: 'white', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.18)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 12, height: 60 }}>

          {/* Logo */}
          <Link to="/" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo-mark-mint.svg" alt="Флип" style={{ width: 32, height: 32 }} />
            <span className="logo-text" style={{ color: 'white', fontWeight: 800, fontSize: 21, letterSpacing: '-0.035em', fontFamily: 'Onest, sans-serif' }}>Флип</span>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="desktop-search" style={{ flex: 1, display: 'flex' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', opacity: 0.45 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск товаров..."
                style={{ width: '100%', padding: '9px 12px 9px 38px', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: '10px 0 0 10px', fontSize: 13, outline: 'none', color: 'white', transition: 'all 0.2s' }}
                onFocus={e => { inputFocusedRef.current = true; e.target.style.background = 'rgba(255,255,255,0.16)'; e.target.style.borderColor = 'rgba(255,255,255,0.4)'; }}
                onBlur={e => { inputFocusedRef.current = false; e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              />
            </div>
            <button type="submit" style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0 10px 10px 0', padding: '9px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13, flexShrink: 0, transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-dark)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
            >Найти</button>
          </form>

          {/* Desktop Nav */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <NavLink to="/catalog">Каталог</NavLink>

            {user && (
              <Link to="/sell" style={{ color: 'white', background: 'var(--primary)', borderRadius: 10, padding: '7px 14px', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-dark)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'none'; }}
              >+ Продать</Link>
            )}

            {user && <IconBtn to="/favorites" title="Избранное"><HeartIcon/></IconBtn>}
            {user && <IconBtn to="/chats" badge={unreadChats}><ChatIcon/></IconBtn>}

            <IconBtn to="/cart" badge={count}><CartIcon/></IconBtn>

            {user ? (
              <div style={{ position: 'relative' }} ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', border: '2px solid rgba(255,255,255,0.3)', color: 'white', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
                >{initials}</button>
                {menuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 46, background: 'white', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.16)', minWidth: 210, overflow: 'hidden', zIndex: 200, border: '1px solid var(--border)' }}>
                    <div style={{ padding: '14px 18px', background: 'var(--primary-bg)', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{user.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.email}</div>
                    </div>
                    {[
                      { to: '/profile', label: '👤 Мой профиль' },
                      ...(user.account_type === 'company' ? [{ to: '/dashboard', label: '📊 Дашборд' }] : []),
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
                      <button onClick={handleLogout} style={{ width: '100%', padding: '11px 18px', background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>Выйти</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" style={{ background: 'var(--primary)', color: 'white', borderRadius: 10, padding: '7px 16px', fontWeight: 700, fontSize: 13, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-dark)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
              >Войти</Link>
            )}
          </nav>

          {/* Mobile right icons */}
          <div className="mobile-icons" style={{ display: 'none', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
            <button onClick={() => setSearchOpen(!searchOpen)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', padding: 8, cursor: 'pointer', borderRadius: 8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            {user ? (
              <Link to="/cart" style={{ color: 'rgba(255,255,255,0.8)', padding: 8, position: 'relative', display: 'flex', borderRadius: 8 }}>
                <CartIcon/>
                {count > 0 && <span style={{ position: 'absolute', top: 3, right: 3, background: 'var(--accent)', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{count}</span>}
              </Link>
            ) : (
              <Link to="/login" style={{ background: 'var(--primary)', color: 'white', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                Войти
              </Link>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', color: 'white', padding: 8, cursor: 'pointer', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
              <span style={{ display: 'block', width: 22, height: 2, background: 'white', borderRadius: 2, transition: 'transform 0.2s', transform: mobileOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}/>
              <span style={{ display: 'block', width: 22, height: 2, background: 'white', borderRadius: 2, opacity: mobileOpen ? 0 : 1, transition: 'opacity 0.2s' }}/>
              <span style={{ display: 'block', width: 22, height: 2, background: 'white', borderRadius: 2, transition: 'transform 0.2s', transform: mobileOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}/>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {searchOpen && (
          <div style={{ padding: '0 16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden' }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск товаров..." autoFocus
                style={{ flex: 1, padding: '11px 14px', background: 'rgba(255,255,255,0.12)', border: 'none', fontSize: 14, outline: 'none', color: 'white' }}
              />
              <button type="submit" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '11px 18px', fontWeight: 700, cursor: 'pointer' }}>→</button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', top: 60, left: 0, right: 0, bottom: 0, zIndex: 99, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileOpen(false)} />
          <div style={{ width: 280, background: '#1A2E1F', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {user ? (
              <>
                {/* Залогинен: профиль + создать объявление */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 16, flexShrink: 0 }}>{initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: 'white', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                    </div>
                  </div>
                  <Link to="/sell" onClick={() => setMobileOpen(false)}
                    style={{ display: 'block', textAlign: 'center', background: 'var(--primary)', color: 'white', padding: '11px 0', borderRadius: 10, fontWeight: 700, fontSize: 14 }}>
                    + Разместить объявление
                  </Link>
                </div>

                <nav style={{ padding: '8px 0', flex: 1 }}>
                  <MobileNavLink to="/" onClick={() => setMobileOpen(false)}>🏠 Главная</MobileNavLink>
                  <MobileNavLink to="/catalog" onClick={() => setMobileOpen(false)}>🔍 Каталог</MobileNavLink>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 20px' }}/>
                  <MobileNavLink to="/profile" onClick={() => setMobileOpen(false)}>👤 Профиль</MobileNavLink>
                  {user.account_type === 'company' && (
                    <MobileNavLink to="/dashboard" onClick={() => setMobileOpen(false)} accent>📊 Дашборд магазина</MobileNavLink>
                  )}
                  <MobileNavLink to="/profile/listings" onClick={() => setMobileOpen(false)}>📦 Мои объявления</MobileNavLink>
                  <MobileNavLink to="/orders" onClick={() => setMobileOpen(false)}>🛍️ Мои заказы</MobileNavLink>
                  <MobileNavLink to="/favorites" onClick={() => setMobileOpen(false)}>♡ Избранное</MobileNavLink>
                  <MobileNavLink to="/chats" onClick={() => setMobileOpen(false)}>💬 Сообщения {unreadChats > 0 && `(${unreadChats})`}</MobileNavLink>
                  <MobileNavLink to="/cart" onClick={() => setMobileOpen(false)}>🛒 Корзина {count > 0 && `(${count})`}</MobileNavLink>
                </nav>

                <div style={{ padding: '12px 20px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button onClick={handleLogout} style={{ width: '100%', padding: '11px', background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.3)', color: '#FF8089', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Выйти</button>
                </div>
              </>
            ) : (
              <>
                {/* Не залогинен: вход/регистрация */}
                <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 12 }}>Войдите, чтобы покупать и продавать</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Link to="/login" onClick={() => setMobileOpen(false)} style={{ flex: 1, textAlign: 'center', background: 'var(--primary)', color: 'white', padding: '11px 0', borderRadius: 10, fontWeight: 700, fontSize: 14 }}>Войти</Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.12)', color: 'white', padding: '11px 0', borderRadius: 10, fontWeight: 700, fontSize: 14 }}>Регистрация</Link>
                  </div>
                </div>

                <nav style={{ padding: '8px 0', flex: 1 }}>
                  <MobileNavLink to="/" onClick={() => setMobileOpen(false)}>🏠 Главная</MobileNavLink>
                  <MobileNavLink to="/catalog" onClick={() => setMobileOpen(false)}>🔍 Каталог</MobileNavLink>
                  <MobileNavLink to="/cart" onClick={() => setMobileOpen(false)}>🛒 Корзина</MobileNavLink>
                </nav>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-search { display: none !important; }
          .desktop-nav { display: none !important; }
          .mobile-icons { display: flex !important; }
          .logo-text { display: inline !important; }
        }
        @media (min-width: 769px) {
          .mobile-icons { display: none !important; }
        }
      `}</style>
    </>
  );
}

function NavLink({ to, children }) {
  return (
    <Link to={to} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500, padding: '7px 11px', borderRadius: 8, transition: 'all 0.15s', whiteSpace: 'nowrap' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
    >{children}</Link>
  );
}

function MobileNavLink({ to, children, onClick, accent }) {
  return (
    <Link to={to} onClick={onClick} style={{ display: 'block', padding: '13px 20px', color: accent ? '#7BC89A' : 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: accent ? 700 : 500, transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >{children}</Link>
  );
}

function IconBtn({ to, children, badge }) {
  return (
    <Link to={to} style={{ color: 'rgba(255,255,255,0.75)', padding: 8, borderRadius: 8, display: 'flex', position: 'relative', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
    >
      {children}
      {badge > 0 && <span style={{ position: 'absolute', top: 2, right: 2, background: 'var(--accent)', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{badge > 99 ? '99+' : badge}</span>}
    </Link>
  );
}

function HeartIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>; }
function CartIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>; }
function ChatIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
