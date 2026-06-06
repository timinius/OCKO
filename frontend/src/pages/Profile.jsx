import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const CITIES = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Другой'];

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || 'Москва',
    about: user?.about || '',
    company_name: user?.company_name || '',
    company_inn: user?.company_inn || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Введите имя'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await api.put('/auth/me', {
        ...form,
        company_name: user.account_type === 'company' ? form.company_name : undefined,
        company_inn: user.account_type === 'company' ? form.company_inn : undefined,
      });
      updateUser(res.data);
      setSuccess('Профиль сохранён');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.put('/auth/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(res.data);
    } catch {
      setError('Ошибка загрузки фото');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Пароли не совпадают'); return; }
    if (pwForm.newPassword.length < 6) { setPwError('Пароль должен быть не менее 6 символов'); return; }
    setSavingPw(true); setPwError(''); setPwSuccess('');
    try {
      await api.put('/auth/me/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwSuccess('Пароль изменён');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (e) {
      setPwError(e.response?.data?.error || 'Ошибка изменения пароля');
    } finally {
      setSavingPw(false);
    }
  };

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              onClick={() => document.getElementById('avatar-file-input').click()}
              style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 24, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
            >
              {user.avatar
                ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
              {avatarLoading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white' }}>...</div>
              )}
            </div>
            <button
              onClick={() => document.getElementById('avatar-file-input').click()}
              title="Изменить фото"
              style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, background: 'var(--primary)', border: '2px solid white', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <input id="avatar-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{user.name}</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{user.email}</div>
            <Link to={`/seller/${user.id}`} style={{ fontSize: 13, color: 'var(--primary)', marginTop: 2, display: 'inline-block' }}>
              Публичный профиль →
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { key: 'profile', label: 'Настройки профиля' },
            { key: 'password', label: 'Смена пароля' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-ghost'}`}>
              {tab.label}
            </button>
          ))}
          <Link to="/profile/listings" className="btn btn-secondary">Мои объявления</Link>
          <Link to="/orders" className="btn btn-ghost">Мои заказы</Link>
        </div>

        {activeTab === 'profile' && (
          <form onSubmit={handleProfile} className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                {user.account_type === 'company' ? 'Данные компании' : 'Личные данные'}
              </h2>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                background: user.account_type === 'company' ? '#EBF3EC' : '#F0F4FF',
                color: user.account_type === 'company' ? 'var(--primary)' : '#5B7FDE',
              }}>
                {user.account_type === 'company' ? '🏢 Компания' : '👤 Частное лицо'}
              </span>
            </div>

            {user.account_type === 'company' && (
              <div style={{ marginBottom: 16, padding: 16, background: 'var(--primary-bg)', borderRadius: 10, border: '1px solid var(--primary)', borderOpacity: 0.3 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary)', marginBottom: 12 }}>Реквизиты компании</div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Название компании *</label>
                  <input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                    className="form-input" placeholder='ООО "Ромашка" или ИП Иванов' />
                </div>
                <div className="form-group">
                  <label className="form-label">ИНН компании</label>
                  <input value={form.company_inn} onChange={e => setForm(p => ({ ...p, company_inn: e.target.value }))}
                    className="form-input" placeholder="1234567890" maxLength={12} />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Имя и фамилия *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="form-input" placeholder="Иван Иванов" required />
              </div>
              <div className="form-group">
                <label className="form-label">Телефон</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="form-input" placeholder="+7 999 000-00-00" />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Город</label>
              <select value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className="form-select">
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">{user.account_type === 'company' ? 'О компании' : 'О себе'}</label>
              <textarea value={form.about} onChange={e => setForm(p => ({ ...p, about: e.target.value }))}
                placeholder={user.account_type === 'company' ? 'Расскажите о компании...' : 'Расскажите о себе как о продавце...'} className="form-textarea" rows={4} />
              <span className="form-hint">Эта информация будет видна на вашей странице продавца</span>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={handlePassword} className="card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Смена пароля</h2>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Текущий пароль *</label>
              <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} className="form-input" required />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Новый пароль *</label>
              <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} className="form-input" placeholder="Минимум 6 символов" required />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Подтвердите новый пароль *</label>
              <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} className="form-input" required />
            </div>
            {pwError && <div className="alert alert-error">{pwError}</div>}
            {pwSuccess && <div className="alert alert-success">{pwSuccess}</div>}
            <button type="submit" disabled={savingPw} className="btn btn-primary">
              {savingPw ? 'Изменение...' : 'Изменить пароль'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
