import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

function formatPrice(p) { return new Intl.NumberFormat('ru-RU').format(p) + ' ₽'; }
const FALLBACK = 'https://via.placeholder.com/80x80?text=No+Image';

export default function Cart() {
  const { user } = useAuth();
  const { items, loading, total, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <h3>Войдите для просмотра корзины</h3>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: 16 }}>Войти</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="spinner" style={{ marginTop: 60 }} />;

  if (items.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <h3>Корзина пуста</h3>
            <p>Добавьте товары из каталога</p>
            <Link to="/catalog" className="btn btn-primary" style={{ marginTop: 16 }}>Перейти в каталог</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Корзина ({items.length})</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'flex-start' }} className="cart-layout">
          <div>
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                <button onClick={clearCart} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  Очистить корзину
                </button>
              </div>
              {items.map((item, idx) => (
                <div key={item.id} style={{ display: 'flex', gap: 16, padding: 20, borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <Link to={`/product/${item.product_id}`}>
                    <img src={item.image || FALLBACK} alt={item.title}
                      style={{ width: 90, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                      onError={e => e.target.src = FALLBACK}
                    />
                  </Link>
                  <div style={{ flex: 1 }}>
                    <Link to={`/product/${item.product_id}`} style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 4, color: 'var(--text)' }}>
                      {item.title}
                    </Link>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      Продавец: {item.seller_name}
                    </div>
                    {item.status !== 'active' && (
                      <span className="badge badge-red" style={{ marginBottom: 8 }}>Недоступен</span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1.5px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                        <button onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
                          style={{ padding: '4px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-secondary)' }}>−</button>
                        <span style={{ padding: '4px 8px', minWidth: 32, textAlign: 'center', fontSize: 14, fontWeight: 500 }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ padding: '4px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-secondary)' }}>+</button>
                      </div>
                      <button onClick={() => removeItem(item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      >
                        ✕ Удалить
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="price">{formatPrice(item.price * item.quantity)}</div>
                    {item.quantity > 1 && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatPrice(item.price)} / шт.</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="card" style={{ padding: 20, position: 'sticky', top: 80 }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Итого</div>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)', flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title} × {item.quantity}
                </span>
                <span style={{ fontWeight: 500, flexShrink: 0 }}>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>Товары ({items.reduce((s, i) => s + i.quantity, 0)} шт.)</span>
              <span className="price">{formatPrice(total)}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 16 }}>✓ Бесплатная доставка</div>
            <button onClick={() => navigate('/checkout')} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Оформить заказ
            </button>
            <Link to="/catalog" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
              Продолжить покупки
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
