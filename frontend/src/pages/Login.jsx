import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  if (user) { navigate(from); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Заполните все поля'); return; }
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      navigate(from);
    } catch (e) {
      setError(e.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page flex-center" style={{ padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo-mark-green.svg" alt="" style={{ width: 40, height: 40 }} />
            <span style={{ color: 'var(--primary-dark)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.035em', fontFamily: 'Onest, sans-serif' }}>Флип</span>
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 12, marginBottom: 4 }}>Вход в аккаунт</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Войдите, чтобы покупать и продавать</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="form-input" placeholder="your@email.com" autoComplete="email" required />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Пароль</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="form-input" placeholder="Ваш пароль" autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12 }}>
                  {showPw ? 'Скрыть' : 'Показать'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: 16 }}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div style={{ padding: 14, background: 'var(--bg)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Демо-аккаунты:</div>
            <div>seller@ocko.ru / password123</div>
            <div>seller2@ocko.ru / password123</div>
          </div>

          <div style={{ textAlign: 'center', fontSize: 14 }}>
            Нет аккаунта?{' '}
            <Link to="/register" style={{ color: 'var(--red)', fontWeight: 600 }}>Зарегистрироваться</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
