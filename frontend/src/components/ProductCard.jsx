import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import StarRating from './StarRating';

const FALLBACK = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Вчера';
  if (days < 30) return `${days} д. назад`;
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function ProductCard({ product, onFavoriteToggle }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [favorited, setFavorited] = useState(product.is_favorited || false);
  const [likes, setLikes] = useState(product.likes_count || 0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { window.location.href = '/login'; return; }
    try {
      if (favorited) {
        await api.delete(`/favorites/${product.id}`);
        setFavorited(false);
        setLikes(l => l - 1);
      } else {
        await api.post(`/favorites/${product.id}`);
        setFavorited(true);
        setLikes(l => l + 1);
      }
      onFavoriteToggle?.();
    } catch {}
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { window.location.href = '/login'; return; }
    try {
      setAddingToCart(true);
      await addToCart(product.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {} finally {
      setAddingToCart(false);
    }
  };

  const image = product.primary_image || product.image || (product.images?.[0]?.url) || FALLBACK;

  return (
    <Link to={`/product/${product.id}`} className="card" style={{ display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s', textDecoration: 'none' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-hover)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
    >
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#f5f5f5' }}>
        <img
          src={image} alt={product.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
          onError={e => { e.target.src = FALLBACK; }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        />
        <button
          onClick={handleFavorite}
          style={{
            position: 'absolute', top: 8, right: 8, width: 34, height: 34,
            background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'transform 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"
            fill={favorited ? '#C0392B' : 'none'}
            stroke={favorited ? '#C0392B' : '#888'}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        {product.condition === 'new' && (
          <span className="badge badge-green" style={{ position: 'absolute', top: 8, left: 8 }}>Новый</span>
        )}
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', flex: 1, gap: 4 }}>
        <div className="price" style={{ fontSize: 17, letterSpacing: '-0.03em' }}>{formatPrice(product.price)}</div>
        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text)' }}>
          {product.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📍 {product.city}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>♡ {likes}</span>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={addingToCart || product.seller_id === user?.id}
          className="btn btn-primary btn-sm"
          style={{ marginTop: 6, width: '100%', fontSize: 12, padding: '8px 10px', minHeight: 36 }}
        >
          {added ? '✓ В корзине' : addingToCart ? '...' : 'В корзину'}
        </button>
      </div>
    </Link>
  );
}
