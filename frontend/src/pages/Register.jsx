import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CITIES = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Другой'];

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', name: '', phone: '', city: 'Москва' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  if (user) { navigate('/'); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) { setError('Заполните обязательные поля'); return; }
    if (form.password !== form.confirmPassword) { setError('Пароли не совпадают'); return; }
    if (form.password.length < 6) { setError('Пароль не менее 6 символов'); return; }
    setLoading(true); setError('');
    try {
      await register({ email: form.email, password: form.password, name: form.name, phone: form.phone, city: form.city });
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });

  return (
    <div className="page flex-center" style={{ padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo-mark-green.svg" alt="" style={{ width: 40, height: 40 }} />
            <span style={{ color: 'var(--primary-dark)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.035em', fontFamily: 'Onest, sans-serif' }}>Флип</span>
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 12, marginBottom: 4 }}>Регистрация</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Создайте аккаунт для покупок и продаж</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Имя и фамилия *</label>
              <input {...f('name')} className="form-input" placeholder="Иван Иванов" required />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Email *</label>
              <input type="email" {...f('email')} className="form-input" placeholder="your@email.com" autoCapitalize="none" autoCorrect="off" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Телефон</label>
                <input {...f('phone')} className="form-input" placeholder="+7 999 000-00-00" />
              </div>
              <div className="form-group">
                <label className="form-label">Город</label>
                <select {...f('city')} className="form-select">
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Пароль * (минимум 6 символов)</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} {...f('password')} className="form-input" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12 }}>
                  {showPw ? 'Скрыть' : 'Показать'}
                </button>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Подтвердите пароль *</label>
              <input type="password" {...f('confirmPassword')} className="form-input" required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: 16 }}>
              {loading ? 'Регистрация...' : 'Создать аккаунт'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: 14 }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" style={{ color: 'var(--red)', fontWeight: 600 }}>Войти</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
