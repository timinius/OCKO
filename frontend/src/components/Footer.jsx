import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: '#111A13', color: '#9AB09E', marginTop: 'auto' }}>
      <div className="container" style={{ padding: '48px 20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 36, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <img src="/logo-mark-mint.svg" alt="" style={{ width: 28, height: 28 }} />
              <span style={{ color: 'white', fontWeight: 800, fontSize: 20, letterSpacing: '-0.035em', fontFamily: 'Onest, sans-serif' }}>Флип</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>
              Современный маркетплейс для покупки и продажи. Быстро, удобно, безопасно.
            </p>
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, marginBottom: 14, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Покупателям</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['/', 'Главная'], ['/catalog', 'Каталог'], ['/cart', 'Корзина'], ['/orders', 'Мои заказы']].map(([to, label]) => (
                <Link key={to} to={to} style={{ color: '#9AB09E', fontSize: 13, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9AB09E'}
                >{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, marginBottom: 14, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Продавцам</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['/sell', 'Разместить объявление'], ['/profile/listings', 'Мои объявления']].map(([to, label]) => (
                <Link key={to} to={to} style={{ color: '#9AB09E', fontSize: 13, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9AB09E'}
                >{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, marginBottom: 14, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Категории</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['electronics', '💻 Электроника'], ['clothing', '👗 Одежда'], ['home', '🏠 Дом и сад'], ['transport', '🚗 Транспорт']].map(([slug, label]) => (
                <Link key={slug} to={`/catalog?category=${slug}`} style={{ color: '#9AB09E', fontSize: 13, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'white'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9AB09E'}
                >{label}</Link>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #1E3322', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12 }}>© 2024 Флип. Все права защищены.</span>
          <span style={{ fontSize: 12, color: '#5A7A5E' }}>Безопасные сделки · Быстрая доставка · Поддержка 24/7</span>
        </div>
      </div>
    </footer>
  );
}
