import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const ORDER_STATUS_LABELS = {
  pending: 'Новый',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};
const ORDER_STATUS_COLORS = {
  pending: { bg: '#FFF8E1', color: '#D97706' },
  processing: { bg: '#E8F0FE', color: '#2563EB' },
  shipped: { bg: '#F0FDF4', color: '#16A34A' },
  delivered: { bg: '#F0FDF4', color: '#15803D' },
  cancelled: { bg: '#FEF2F2', color: '#DC2626' },
};

function StatCard({ label, value, sub }) {
  return (
    <div className="card" style={{ padding: '20px 24px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [updatingProduct, setUpdatingProduct] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.account_type !== 'company') { navigate('/'); return; }
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (tab === 'orders') fetchOrders();
    if (tab === 'products') fetchProducts();
  }, [tab]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/seller/stats');
      setStats(res.data);
    } catch {} finally { setLoadingStats(false); }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/seller/orders');
      setOrders(res.data);
    } catch {} finally { setLoadingOrders(false); }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get(`/products?seller_id=${user.id}&limit=50`);
      setProducts(res.data.products || []);
    } catch {} finally { setLoadingProducts(false); }
  };

  const updateOrderStatus = async (orderId, status) => {
    setUpdatingOrder(orderId);
    try {
      await api.patch(`/seller/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch {} finally { setUpdatingOrder(null); }
  };

  const updateProductStatus = async (productId, status) => {
    setUpdatingProduct(productId);
    try {
      await api.patch(`/products/${productId}/status`, { status });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status } : p));
    } catch {} finally { setUpdatingProduct(null); }
  };

  const tabs = [
    { id: 'overview', label: 'Обзор' },
    { id: 'orders', label: 'Заказы' },
    { id: 'products', label: 'Товары' },
  ];

  if (!user) return null;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 960 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em', margin: 0, lineHeight: 1.1 }}>
              {user.company_name || 'Дашборд'}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Панель управления магазином</div>
          </div>
          <Link to="/sell" className="btn btn-primary" style={{ fontSize: 14, padding: '10px 20px' }}>
            + Новый товар
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg)', padding: 4, borderRadius: 14, width: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                background: tab === t.id ? 'white' : 'transparent',
                color: tab === t.id ? 'var(--text)' : 'var(--text-secondary)',
                boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}>{t.label}</button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div>
            {loadingStats ? <div className="spinner" /> : stats && (
              <>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
                  <StatCard label="Активных товаров" value={stats.active_products} />
                  <StatCard label="Продано" value={stats.sold_products} />
                  <StatCard label="Всего просмотров" value={stats.total_views} />
                  <StatCard label="Заказов" value={stats.total_orders} />
                  <StatCard label="Выручка" value={`${new Intl.NumberFormat('ru-RU').format(stats.total_revenue)} ₽`} />
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button onClick={() => setTab('orders')} className="btn btn-secondary" style={{ fontSize: 14 }}>Перейти к заказам</button>
                  <button onClick={() => setTab('products')} className="btn btn-secondary" style={{ fontSize: 14 }}>Управление товарами</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <div>
            {loadingOrders ? <div className="spinner" /> : orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <h3>Заказов пока нет</h3>
                <p>Когда покупатели оформят заказы, они появятся здесь</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {orders.map(order => {
                  const sc = ORDER_STATUS_COLORS[order.status] || { bg: 'var(--bg)', color: 'var(--text-secondary)' };
                  return (
                    <div key={order.id} className="card" style={{ padding: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>Заказ #{order.id}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {order.buyer_name} · {order.buyer_email}
                            {order.buyer_phone && ` · ${order.buyer_phone}`}
                          </div>
                          {order.address && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>📍 {order.address}</div>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color }}>
                            {ORDER_STATUS_LABELS[order.status] || order.status}
                          </span>
                          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
                            {new Intl.NumberFormat('ru-RU').format(order.total_price)} ₽
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                        {order.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg)', borderRadius: 10 }}>
                            {item.product_image && (
                              <img src={item.product_image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_title}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.quantity} шт. × {new Intl.NumberFormat('ru-RU').format(item.price)} ₽</div>
                            </div>
                            <Link to={`/product/${item.product_id}`} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>Открыть</Link>
                          </div>
                        ))}
                      </div>

                      {/* Status update */}
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {Object.entries(ORDER_STATUS_LABELS).filter(([k]) => k !== 'pending' || order.status === 'pending').map(([val, label]) => {
                            if (val === order.status) return null;
                            if (val === 'pending') return null;
                            const isCurrent = val === order.status;
                            return (
                              <button key={val} disabled={updatingOrder === order.id || isCurrent}
                                onClick={() => updateOrderStatus(order.id, val)}
                                style={{
                                  padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                                  border: '1.5px solid var(--border)', background: 'white', color: 'var(--text)',
                                  cursor: updatingOrder === order.id ? 'not-allowed' : 'pointer', opacity: updatingOrder === order.id ? 0.6 : 1,
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { if (updatingOrder !== order.id) { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; } }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                              >
                                {updatingOrder === order.id ? '...' : `→ ${label}`}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Products */}
        {tab === 'products' && (
          <div>
            {loadingProducts ? <div className="spinner" /> : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🛍</div>
                <h3>Нет товаров</h3>
                <p>Добавьте первый товар в ваш магазин</p>
                <Link to="/sell" className="btn btn-primary" style={{ marginTop: 8 }}>Добавить товар</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {products.map(p => {
                  const isSold = p.status === 'sold';
                  const isArchived = p.status === 'archived';
                  return (
                    <div key={p.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, opacity: isArchived ? 0.65 : 1 }}>
                      <img
                        src={p.primary_image || p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                        alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0, filter: isSold ? 'grayscale(0.4)' : 'none' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {new Intl.NumberFormat('ru-RU').format(p.price)} ₽
                          {p.views > 0 && <span style={{ marginLeft: 8 }}>· 👁 {p.views}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                          background: isSold ? '#F0FDF4' : isArchived ? 'var(--bg)' : 'var(--primary-bg)',
                          color: isSold ? '#15803D' : isArchived ? 'var(--text-secondary)' : 'var(--primary-dark)',
                        }}>
                          {isSold ? 'Продано' : isArchived ? 'Архив' : 'Активно'}
                        </span>
                        <Link to={`/product/${p.id}`} style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none', padding: '5px 10px', borderRadius: 8, background: 'var(--bg)' }}>Открыть</Link>
                        {isSold && (
                          <button onClick={() => updateProductStatus(p.id, 'active')} disabled={updatingProduct === p.id}
                            style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, border: 'none', background: 'var(--primary-bg)', padding: '5px 12px', borderRadius: 8, cursor: 'pointer' }}>
                            {updatingProduct === p.id ? '...' : 'В продажу'}
                          </button>
                        )}
                        {!isSold && !isArchived && (
                          <button onClick={() => updateProductStatus(p.id, 'archived')} disabled={updatingProduct === p.id}
                            style={{ fontSize: 12, color: 'var(--text-secondary)', border: '1.5px solid var(--border)', background: 'white', padding: '4px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                            {updatingProduct === p.id ? '...' : 'Снять'}
                          </button>
                        )}
                        {isArchived && (
                          <button onClick={() => updateProductStatus(p.id, 'active')} disabled={updatingProduct === p.id}
                            style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, border: 'none', background: 'var(--primary-bg)', padding: '5px 12px', borderRadius: 8, cursor: 'pointer' }}>
                            {updatingProduct === p.id ? '...' : 'Восстановить'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
