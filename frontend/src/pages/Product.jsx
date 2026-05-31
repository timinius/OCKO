import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';
import ProductCard from '../components/ProductCard';

function formatPrice(p) { return new Intl.NumberFormat('ru-RU').format(p) + ' ₽'; }
function formatDate(d) { return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }); }

export default function Product() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setImgIndex(0);
    Promise.all([
      api.get(`/products/${id}`),
      api.get(`/reviews/product/${id}`),
    ]).then(([pRes, rRes]) => {
      setProduct(pRes.data);
      setFavorited(pRes.data.is_favorited);
      setReviews(rRes.data);
      if (pRes.data.category_id) {
        api.get(`/products?category=${pRes.data.category_slug}&limit=4`).then(r => {
          setRelated(r.data.products.filter(p => p.id !== parseInt(id)));
        });
      }
    }).catch(() => setProduct(null)).finally(() => setLoading(false));
  }, [id]);

  const handleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      if (favorited) {
        await api.delete(`/favorites/${id}`);
        setFavorited(false);
        setProduct(p => ({ ...p, likes_count: p.likes_count - 1 }));
      } else {
        await api.post(`/favorites/${id}`);
        setFavorited(true);
        setProduct(p => ({ ...p, likes_count: p.likes_count + 1 }));
      }
    } catch {}
  };

  const handleCart = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      setCartLoading(true);
      await addToCart(parseInt(id));
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 3000);
    } catch (e) {
      alert(e.response?.data?.error || 'Ошибка добавления в корзину');
    } finally {
      setCartLoading(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setReviewLoading(true); setReviewError('');
    try {
      const res = await api.post('/reviews', {
        seller_id: product.seller_id,
        product_id: parseInt(id),
        rating: newReview.rating,
        comment: newReview.comment,
      });
      setReviews(prev => [res.data, ...prev]);
      setNewReview({ rating: 5, comment: '' });
    } catch (e) {
      setReviewError(e.response?.data?.error || 'Ошибка отправки отзыва');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <div className="spinner" style={{ marginTop: 60 }} />;
  if (!product) return (
    <div className="empty-state page">
      <div className="empty-state-icon">😕</div>
      <h3>Товар не найден</h3>
      <Link to="/catalog" className="btn btn-primary" style={{ marginTop: 16 }}>В каталог</Link>
    </div>
  );

  const images = product.images || [];
  const currentImg = images[imgIndex]?.url || 'https://via.placeholder.com/600x400';

  return (
    <div className="page">
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/">Главная</Link><span>›</span>
          <Link to="/catalog">Каталог</Link><span>›</span>
          {product.category_name && <><Link to={`/catalog?category=${product.category_slug}`}>{product.category_name}</Link><span>›</span></>}
          <span>{product.title}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, marginBottom: 32 }} className="product-layout">
          {/* Left: Images + Details */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              {/* Image Gallery */}
              <div style={{ position: 'relative', background: '#f5f5f5', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
                <img src={currentImg} alt={product.title}
                  style={{ width: '100%', height: 420, objectFit: 'contain', display: 'block' }}
                  onError={e => e.target.src = 'https://via.placeholder.com/600x400?text=No+Image'}
                />
                {images.length > 1 && (
                  <>
                    <button onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                    <button onClick={() => setImgIndex(i => (i + 1) % images.length)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 8, padding: '12px 16px', flexWrap: 'wrap' }}>
                  {images.map((img, i) => (
                    <img key={i} src={img.url} alt="" onClick={() => setImgIndex(i)}
                      style={{ width: 72, height: 60, objectFit: 'cover', borderRadius: 6, cursor: 'pointer',
                        border: i === imgIndex ? '2px solid var(--red)' : '2px solid transparent', transition: 'border-color 0.15s' }}
                      onError={e => e.target.style.display = 'none'}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="card" style={{ padding: '0 20px 20px' }}>
              <div className="tabs">
                {[['description', 'Описание'], ['characteristics', 'Характеристики'], ['reviews', `Отзывы (${reviews.length})`]].map(([key, label]) => (
                  <button key={key} className={`tab-btn ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>{label}</button>
                ))}
              </div>

              {activeTab === 'description' && (
                <div>
                  <p style={{ lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{product.description || 'Описание не указано'}</p>
                  <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg)', borderRadius: 8 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>👁 {product.views} просмотров · ♡ {product.likes_count} в избранном</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📅 Размещено: {formatDate(product.created_at)}</div>
                  </div>
                </div>
              )}

              {activeTab === 'characteristics' && (
                <div>
                  {[
                    ['Категория', product.category_name],
                    ['Состояние', product.condition === 'new' ? 'Новый' : 'Б/у'],
                    ['Город', product.city],
                    ['В наличии', product.stock + ' шт.'],
                    ['ID объявления', '#' + product.id],
                  ].map(([label, value]) => value ? (
                    <div key={label} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ width: 160, color: 'var(--text-secondary)', fontSize: 13, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{value}</span>
                    </div>
                  ) : null)}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  {user && user.id !== product.seller_id && (
                    <form onSubmit={handleReview} style={{ marginBottom: 24, padding: 16, background: 'var(--bg)', borderRadius: 8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 12 }}>Оставить отзыв</div>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Оценка</div>
                        <StarRating value={newReview.rating} onChange={r => setNewReview(p => ({ ...p, rating: r }))} size={28} />
                      </div>
                      <textarea value={newReview.comment} onChange={e => setNewReview(p => ({ ...p, comment: e.target.value }))}
                        placeholder="Расскажите о товаре и продавце..." className="form-textarea" style={{ marginBottom: 8 }} />
                      {reviewError && <div className="alert alert-error">{reviewError}</div>}
                      <button type="submit" disabled={reviewLoading} className="btn btn-primary">
                        {reviewLoading ? 'Отправка...' : 'Отправить отзыв'}
                      </button>
                    </form>
                  )}
                  {reviews.length === 0 ? (
                    <div className="empty-state" style={{ padding: 32 }}>
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

          {/* Right: Buy panel */}
          <div style={{ position: 'sticky', top: 80, alignSelf: 'flex-start' }} className="product-buy-panel">
            <div className="card" style={{ padding: 20, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className={`badge ${product.condition === 'new' ? 'badge-green' : 'badge-gray'}`}>
                  {product.condition === 'new' ? 'Новый' : 'Б/у'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📍 {product.city}</span>
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 }}>{product.title}</h1>
              <div className="price price-lg" style={{ marginBottom: 20 }}>{formatPrice(product.price)}</div>

              {product.status !== 'active' ? (
                <div className="alert alert-error">Товар недоступен</div>
              ) : user?.id === product.seller_id ? (
                <div>
                  <div className="alert" style={{ background: '#EBF3EC', color: 'var(--green-dark)', marginBottom: 8 }}>Это ваше объявление</div>
                  <Link to={`/edit/${product.id}`} className="btn btn-outline" style={{ width: '100%' }}>Редактировать</Link>
                </div>
              ) : (
                <>
                  <button onClick={handleCart} disabled={cartLoading} className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: 10 }}>
                    {cartAdded ? '✓ Добавлено в корзину' : cartLoading ? 'Добавление...' : '🛒 В корзину'}
                  </button>
                  <button onClick={() => { handleCart(); navigate('/cart'); }} className="btn btn-secondary btn-lg" style={{ width: '100%', marginBottom: 10 }}>
                    Купить сейчас
                  </button>
                  <button onClick={handleFavorite} className={`btn btn-ghost`} style={{ width: '100%' }}>
                    {favorited ? '♥ В избранном' : '♡ В избранное'}
                  </button>
                </>
              )}
            </div>

            {/* Seller card */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Продавец</div>
              <Link to={`/seller/${product.seller_id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                  {product.seller_name?.charAt(0) || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{product.seller_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <StarRating value={product.seller_rating || 0} size={14} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{product.seller_rating?.toFixed(1) || '0'} ({product.seller_reviews_count || 0})</span>
                  </div>
                </div>
              </Link>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                📍 {product.seller_city} · На OCKO с {new Date(product.seller_since).getFullYear()}
              </div>
              <Link to={`/seller/${product.seller_id}`} className="btn btn-ghost btn-sm" style={{ width: '100%', marginBottom: 8 }}>
                Все объявления продавца
              </Link>
              {user && user.id !== product.seller_id && (
                <button
                  disabled={chatLoading}
                  onClick={async () => {
                    if (!user) { navigate('/login'); return; }
                    setChatLoading(true);
                    try {
                      const res = await api.post('/chat/conversations', { product_id: product.id, seller_id: product.seller_id });
                      navigate(`/chats?conv=${res.data.id}`);
                    } finally {
                      setChatLoading(false);
                    }
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%' }}
                >
                  {chatLoading ? 'Открываем чат...' : '💬 Написать продавцу'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 className="section-title">Похожие товары</h2>
            <div className="grid-4">
              {related.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
