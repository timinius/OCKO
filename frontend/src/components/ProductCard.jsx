import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const FALLBACK = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

export default function ProductCard({ product, onFavoriteToggle }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [favorited, setFavorited] = useState(product.is_favorited || false);
  const [likes, setLikes] = useState(product.likes_count || 0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleFavorite = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { window.location.href = '/login'; return; }
    try {
      if (favorited) {
        await api.delete(`/favorites/${product.id}`);
        setFavorited(false); setLikes(l => l - 1);
      } else {
        await api.post(`/favorites/${product.id}`);
        setFavorited(true); setLikes(l => l + 1);
      }
      onFavoriteToggle?.();
    } catch {}
  };

  const handleAddToCart = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { window.location.href = '/login'; return; }
    try {
      setAddingToCart(true);
      await addToCart(product.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
    } catch {} finally {
      setAddingToCart(false);
    }
  };

  const image = product.primary_image || product.image || (product.images?.[0]?.url) || FALLBACK;
  const isOwn = product.seller_id === user?.id;

  return (
    <Link
      to={`/product/${product.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', textDecoration: 'none',
        borderRadius: 20, overflow: 'hidden', background: 'white',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 20px 60px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.07)'
          : '0 1px 3px rgba(0,0,0,0.05), 0 4px 18px rgba(0,0,0,0.06)',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#EEEEED' }}>
        <img
          src={image} alt={product.title}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transform: hovered ? 'scale(1.07)' : 'scale(1)',
            transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          onError={e => { e.target.src = FALLBACK; }}
        />

        {/* Condition badge */}
        {product.condition === 'new' && (
          <span style={{
            position: 'absolute', top: 10, left: 10,
            background: 'var(--primary)', color: 'white',
            padding: '4px 10px', borderRadius: 100,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
          }}>НОВЫЙ</span>
        )}

        {/* Favorite */}
        <button
          onClick={handleFavorite}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 34, height: 34,
            background: favorited ? '#FEE8EA' : 'rgba(255,255,255,0.94)',
            border: 'none', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
            transition: 'transform 0.2s, background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.14)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24"
            fill={favorited ? '#E63946' : 'none'}
            stroke={favorited ? '#E63946' : '#999'}
            strokeWidth="2.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
          {formatPrice(product.price)}
        </div>
        <div style={{
          fontSize: 13, color: 'var(--text)', lineHeight: 1.35, fontWeight: 400,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {product.title}
        </div>
        <div style={{
          fontSize: 11, color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 'auto', paddingTop: 4,
        }}>
          <span>📍 {product.city}</span>
          {likes > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {likes}
          </span>}
        </div>

        {!isOwn && (
          <button
            onClick={handleAddToCart}
            disabled={addingToCart}
            style={{
              marginTop: 6, width: '100%', padding: '9px 0',
              background: added ? 'var(--primary-bg)' : 'var(--primary)',
              color: added ? 'var(--primary)' : 'white',
              border: 'none', borderRadius: 12,
              fontSize: 12, fontWeight: 700, cursor: addingToCart ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', letterSpacing: '0.02em',
            }}
          >
            {added ? '✓ В корзине' : addingToCart ? '...' : 'В корзину'}
          </button>
        )}
      </div>
    </Link>
  );
}
