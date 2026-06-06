import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function AddProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', price: '', category_id: '', condition: 'new', city: user?.city || 'Москва', stock: 1 });
  const [photoItems, setPhotoItems] = useState([]); // [{src, file, key}]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dragIdx = useRef(null);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data));
  }, []);

  if (!user) return (
    <div className="page"><div className="container">
      <div className="empty-state"><div className="empty-state-icon">🔒</div>
        <h3>Необходима авторизация</h3>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 16 }}>Войти</Link>
      </div>
    </div></div>
  );

  const addPhotos = (e) => {
    const files = Array.from(e.target.files);
    const newItems = files.map(f => ({ src: URL.createObjectURL(f), file: f, key: `${Date.now()}-${Math.random()}` }));
    setPhotoItems(prev => [...prev, ...newItems].slice(0, 10));
    e.target.value = '';
  };

  const removePhoto = (key) => {
    setPhotoItems(prev => {
      const item = prev.find(p => p.key === key);
      if (item?.file) URL.revokeObjectURL(item.src);
      return prev.filter(p => p.key !== key);
    });
  };

  const handleDragOver = (e, targetIdx) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === targetIdx) return;
    setPhotoItems(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIdx.current, 1);
      arr.splice(targetIdx, 0, moved);
      dragIdx.current = targetIdx;
      return arr;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Введите название'); return; }
    if (!form.price || parseFloat(form.price) <= 0) { setError('Введите корректную цену'); return; }
    setLoading(true); setError('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      photoItems.forEach(item => formData.append('images', item.file));
      const res = await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate(`/product/${res.data.id}`);
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка создания объявления');
    } finally {
      setLoading(false);
    }
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 740 }}>
        <div className="breadcrumbs">
          <Link to="/">Главная</Link><span>›</span><span>Новое объявление</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Разместить объявление</h1>

        <form onSubmit={handleSubmit}>
          {/* Images */}
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📷 Фотографии</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              {photoItems.map((item, i) => (
                <div key={item.key}
                  draggable
                  onDragStart={() => { dragIdx.current = i; }}
                  onDragOver={e => handleDragOver(e, i)}
                  onDragEnd={() => { dragIdx.current = null; }}
                  style={{ position: 'relative', width: 120, height: 110, borderRadius: 10, overflow: 'hidden', border: i === 0 ? '2.5px solid var(--primary)' : '2px solid var(--border)', cursor: 'grab', flexShrink: 0 }}
                >
                  <img src={item.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {i === 0 && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--primary)', color: 'white', fontSize: 10, fontWeight: 700, textAlign: 'center', padding: '3px 0', letterSpacing: '0.04em' }}>
                      ГЛАВНАЯ
                    </div>
                  )}
                  <button type="button" onClick={() => removePhoto(item.key)}
                    style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, lineHeight: 1, fontWeight: 700 }}>
                    ×
                  </button>
                  <div style={{ position: 'absolute', top: 5, left: 5, color: 'white', fontSize: 13, opacity: 0.75, cursor: 'grab', lineHeight: 1 }}>⠿</div>
                </div>
              ))}
              {photoItems.length < 10 && (
                <label style={{ width: 120, height: 110, border: '2px dashed var(--border)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, gap: 6, transition: 'border-color 0.15s, color 0.15s', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <span style={{ fontSize: 28, lineHeight: 1 }}>+</span>
                  <span>{photoItems.length === 0 ? 'Добавить фото' : 'Ещё фото'}</span>
                  <input type="file" multiple accept="image/*" onChange={addPhotos} style={{ display: 'none' }} />
                </label>
              )}
            </div>
            <div className="form-hint">Первое фото — главное. Перетащите для сортировки. До 10 фото</div>
          </div>

          {/* Main info */}
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📝 Описание</h2>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Название объявления *</label>
              <input {...f('title')} className="form-input" placeholder="Например: iPhone 15 Pro Max 256GB" maxLength={100} required />
              <span className="form-hint">{form.title.length}/100</span>
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Описание</label>
              <textarea {...f('description')} className="form-textarea" rows={5} placeholder="Расскажите о товаре подробнее: состояние, комплектация, причина продажи..." maxLength={2000} />
              <span className="form-hint">{(form.description || '').length}/2000</span>
            </div>
            <div className="form-group">
              <label className="form-label">Категория</label>
              <select {...f('category_id')} className="form-select">
                <option value="">Выберите категорию</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Price & condition */}
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>💰 Цена и состояние</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Цена, ₽ *</label>
                <input type="number" {...f('price')} className="form-input" placeholder="0" min="1" required />
              </div>
              <div className="form-group">
                <label className="form-label">Состояние</label>
                <select {...f('condition')} className="form-select">
                  <option value="new">Новый</option>
                  <option value="used">Б/у</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">В наличии (шт.)</label>
                <input type="number" {...f('stock')} className="form-input" min="1" placeholder="1" />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📍 Местоположение</h2>
            <div className="form-group">
              <label className="form-label">Город</label>
              <input {...f('city')} className="form-input" placeholder="Москва" />
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ flex: 1 }}>
              {loading ? 'Размещение...' : 'Разместить объявление'}
            </button>
            <Link to="/" className="btn btn-ghost btn-lg">Отмена</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
