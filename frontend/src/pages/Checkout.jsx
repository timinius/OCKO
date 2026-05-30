import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

function formatPrice(p) { return new Intl.NumberFormat('ru-RU').format(p) + ' ₽'; }
const FALLBACK = 'https://via.placeholder.com/60x60?text=IMG';

export default function Checkout() {
  const { user } = useAuth();
  const { items, total, fetchCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    address: user?.city ? `г. ${user.city}, ` : '',
    payment_method: 'card',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) return (
    <div className="page"><div className="container">
      <div className="empty-state"><div className="empty-state-icon">🔒</div><h3>Необходима авторизация</h3>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 16 }}>Войти</Link>
      </div>
    </div></div>
  );

  if (items.length === 0) return (
    <div className="page"><div className="container">
      <div className="empty-state"><div className="empty-state-icon">🛒</div><h3>Корзина пуста</h3>
        <Link to="/catalog" className="btn btn-primary" style={{ marginTop: 16 }}>В каталог</Link>
      </div>
    </div></div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.address.trim()) { setError('Укажите адрес доставки'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/orders', form);
      await fetchCart();
      navigate(`/orders/${res.data.id}`, { state: { success: true } });
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка оформления заказа');
    } finally {
      setLoading(false);
    }
  };

  const PAYMENT = [
    { value: 'card', label: '💳 Банковская карта', desc: 'Visa, Mastercard, МИР' },
    { value: 'cash', label: '💵 Наличными при получении', desc: 'Оплата курьеру' },
    { value: 'sbp', label: '📱 СБП', desc: 'Система быстрых платежей' },
  ];

  return (
    <div className="page">
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/cart">Корзина</Link><span>›</span><span>Оформление заказа</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Оформление заказа</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'flex-start' }} className="checkout-layout">
          <form onSubmit={handleSubmit}>
            {/* Delivery */}
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>📦 Доставка</h2>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Адрес доставки *</label>
                <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Город, улица, дом, квартира"
                  className="form-textarea" rows={3} required />
              </div>
              <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                🚚 Срок доставки: 1–7 рабочих дней · Бесплатно
              </div>
            </div>

            {/* Payment */}
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>💳 Способ оплаты</h2>
              {PAYMENT.map(p => (
                <label key={p.value} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', marginBottom: 8,
                  border: `2px solid ${form.payment_method === p.value ? 'var(--red)' : 'var(--border)'}`,
                  borderRadius: 8, cursor: 'pointer', transition: 'border-color 0.15s',
                  background: form.payment_method === p.value ? '#FDECEA' : 'white',
                }}>
                  <input type="radio" name="payment" value={p.value} checked={form.payment_method === p.value}
                    onChange={() => setForm(prev => ({ ...prev, payment_method: p.value }))}
                    style={{ accentColor: 'var(--red)', marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{p.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Recipient */}
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>👤 Получатель</h2>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, fontSize: 14 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 2 }}>Имя</div>
                  <div style={{ fontWeight: 500 }}>{user.name}</div>
                </div>
                <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, fontSize: 14 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 2 }}>Телефон</div>
                  <div style={{ fontWeight: 500 }}>{user.phone || 'Не указан'}</div>
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                Для изменения данных перейдите в <Link to="/profile" style={{ color: 'var(--red)' }}>настройки профиля</Link>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              {loading ? 'Оформление...' : `Оформить заказ · ${formatPrice(total)}`}
            </button>
          </form>

          {/* Order summary */}
          <div className="card" style={{ padding: 20, position: 'sticky', top: 80 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Ваш заказ</div>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <img src={item.image || FALLBACK} alt="" style={{ width: 52, height: 48, objectFit: 'cover', borderRadius: 6 }}
                  onError={e => e.target.src = FALLBACK} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3, marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>× {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, flexShrink: 0 }}>{formatPrice(item.price * item.quantity)}</div>
              </div>
            ))}
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
              <span>Товары</span><span>{formatPrice(total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--green)', marginBottom: 12 }}>
              <span>Доставка</span><span>Бесплатно</span>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
              <span>Итого</span><span className="text-red">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
