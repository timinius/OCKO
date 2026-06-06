import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function EditProduct() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [photoItems, setPhotoItems] = useState([]); // [{src, file?, key}]
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dragIdx = useRef(null);

  useEffect(() => {
    Promise.all([api.get(`/products/${id}`), api.get('/categories')]).then(([pRes, cRes]) => {
      const p = pRes.data;
      if (p.seller_id !== user?.id) { navigate('/'); return; }
      setForm({ title: p.title, description: p.description || '', price: p.price, category_id: p.category_id || '', condition: p.condition, city: p.city, stock: p.stock, status: p.status });
      const sorted = [...(p.images || [])].sort((a, b) => b.is_primary - a.is_primary);
      setPhotoItems(sorted.map(img => ({ src: img.url, file: null, key: img.url })));
      setCategories(cRes.data);
    }).finally(() => setLoading(false));
  }, [id, user, navigate]);

  if (loading) return <div className="spinner" style={{ marginTop: 60 }} />;
  if (!form) return null;

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
    setSaving(true); setError('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      // photo_order: 'new' for new files, URL for existing ones
      const photoOrder = photoItems.map(item => item.file ? 'new' : item.src);
      formData.append('photo_order', JSON.stringify(photoOrder));
      photoItems.filter(item => item.file).forEach(item => formData.append('images', item.file));
      await api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate(`/product/${id}`);
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 740 }}>
        <div className="breadcrumbs">
          <Link to="/profile/listings">Мои объявления</Link><span>›</span><span>Редактирование</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Редактировать объявление</h1>

        <form onSubmit={handleSubmit}>
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
                  <img src={item.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }} />
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

          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📝 Описание</h2>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Название *</label>
              <input {...f('title')} className="form-input" required />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Описание</label>
              <textarea {...f('description')} className="form-textarea" rows={5} />
            </div>
            <div className="form-group">
              <label className="form-label">Категория</label>
              <select {...f('category_id')} className="form-select">
                <option value="">Без категории</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>💰 Цена и состояние</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Цена, ₽</label>
                <input type="number" {...f('price')} className="form-input" min="1" />
              </div>
              <div className="form-group">
                <label className="form-label">Состояние</label>
                <select {...f('condition')} className="form-select">
                  <option value="new">Новый</option>
                  <option value="used">Б/у</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">В наличии</label>
                <input type="number" {...f('stock')} className="form-input" min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Статус</label>
                <select {...f('status')} className="form-select">
                  <option value="active">Активно</option>
                  <option value="archived">Архив</option>
                  <option value="sold">Продано</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Город</label>
              <input {...f('city')} className="form-input" />
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={saving} className="btn btn-primary btn-lg" style={{ flex: 1 }}>
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <Link to={`/product/${id}`} className="btn btn-ghost btn-lg">Отмена</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
