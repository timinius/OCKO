import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';
import ProductCard from '../components/ProductCard';

function formatDate(d) { return new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }); }

export default function Seller() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/products?seller_id=${id}&limit=50`),
      api.get(`/reviews/seller/${id}`),
    ]).then(([sRes, pRes, rRes]) => {
      setSeller(sRes.data);
      setProducts(pRes.data.products || []);
      setReviews(rRes.data || []);
    }).catch(() => setSeller(null)).finally(() => setLoading(false));
  }, [id]);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setReviewLoading(true); setReviewError('');
    try {
      const res = await api.post('/reviews', { seller_id: parseInt(id), rating: newReview.rating, comment: newReview.comment });
      setReviews(prev => [res.data, ...prev]);
      setSeller(s => ({ ...s, reviews_count: s.reviews_count + 1 }));
      setNewReview({ rating: 5, comment: '' });
    } catch (e) {
      setReviewError(e.response?.data?.error || 'Ошибка отправки');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <div className="spinner" style={{ marginTop: 60 }} />;
  if (!seller) return (
    <div className="empty-state page">
      <div className="empty-state-icon">😕</div>
      <h3>Продавец не найден</h3>
    </div>
  );

  const isCompany = seller.account_type === 'company';
  const initials = seller.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isOwnProfile = user?.id === parseInt(id);
  const ratingBars = [5,4,3,2,1].map(star => ({
    star, count: reviews.filter(r => r.rating === star).length,
  }));
  const maxCount = Math.max(...ratingBars.map(b => b.count), 1);

  return (
    <div className="page">
      <div className="container">
        {/* Seller header */}
        <div className="card" style={{ padding: '28px 28px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          {/* Avatar / Store Logo */}
          <div style={{
            width: 90, height: 90, borderRadius: isCompany ? 20 : '50%',
            background: isCompany ? 'var(--primary-bg)' : 'var(--green)',
            color: isCompany ? 'var(--primary-dark)' : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: isCompany ? 36 : 30, flexShrink: 0,
            border: isCompany ? '2px solid var(--border)' : 'none',
          }}>
            {seller.avatar
              ? <img src={seller.avatar} style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} alt="" />
              : isCompany ? '🏢' : initials}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                {isCompany && seller.company_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>{seller.company_name}</h1>
                    <span style={{ background: 'var(--primary)', color: 'white', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', flexShrink: 0 }}>МАГАЗИН</span>
                  </div>
                )}
                <h2 style={{ fontSize: isCompany ? 14 : 22, fontWeight: isCompany ? 500 : 700, color: isCompany ? 'var(--text-secondary)' : 'var(--text)', margin: '0 0 6px' }}>
                  {isCompany ? `Контакт: ${seller.name}` : seller.name}
                </h2>
                {isCompany && seller.company_inn && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>ИНН: {seller.company_inn}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <StarRating value={seller.rating || 0} size={18} />
                  <span style={{ fontWeight: 600, fontSize: 16 }}>{(seller.rating || 0).toFixed(1)}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>({seller.reviews_count} отзывов)</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  {seller.city && <span>📍 {seller.city}</span>}
                  <span>📅 На Флип с {formatDate(seller.created_at)}</span>
                  <span>📦 {seller.products_count} {isCompany ? 'товаров' : 'объявлений'}</span>
                </div>
              </div>
              {isOwnProfile && (
                <Link to={isCompany ? '/dashboard' : '/profile'} className="btn btn-outline btn-sm">
                  {isCompany ? 'Дашборд магазина' : 'Редактировать профиль'}
                </Link>
              )}
            </div>
            {seller.about && (
              <p style={{ marginTop: 12, fontSize: 14, color: 'var(--text)', lineHeight: 1.6, maxWidth: 600 }}>{seller.about}</p>
            )}
          </div>

          {/* Rating distribution */}
          {reviews.length > 0 && (
            <div style={{ minWidth: 200 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Распределение оценок</div>
              {ratingBars.map(({ star, count }) => (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, width: 10, color: 'var(--text-secondary)' }}>{star}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#F5A623"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                  <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--primary)', width: `${(count / maxCount) * 100}%`, borderRadius: 4, transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 16, textAlign: 'right' }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            {isCompany ? 'Товары' : 'Объявления'} ({products.length})
          </button>
          <button className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
            Отзывы ({reviews.length})
          </button>
        </div>

        {activeTab === 'products' && (
          products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>{isCompany ? 'Нет товаров' : 'Нет активных объявлений'}</h3>
            </div>
          ) : (
            <div className="grid-4">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )
        )}

        {activeTab === 'reviews' && (
          <div style={{ maxWidth: 700 }}>
            {user && !isOwnProfile && (
              <form onSubmit={handleReview} style={{ marginBottom: 24, padding: 20, background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)' }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Оставить отзыв о продавце</div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Оценка</div>
                  <StarRating value={newReview.rating} onChange={r => setNewReview(p => ({ ...p, rating: r }))} size={28} />
                </div>
                <textarea value={newReview.comment} onChange={e => setNewReview(p => ({ ...p, comment: e.target.value }))}
                  placeholder="Расскажите о вашем опыте работы с продавцом..." className="form-textarea" style={{ marginBottom: 8 }} />
                {reviewError && <div className="alert alert-error">{reviewError}</div>}
                <button type="submit" disabled={reviewLoading} className="btn btn-primary">
                  {reviewLoading ? 'Отправка...' : 'Отправить отзыв'}
                </button>
              </form>
            )}
            {reviews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <h3>Пока нет отзывов</h3>
              </div>
            ) : (
              reviews.map(r => <ReviewCard key={r.id} review={r} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
