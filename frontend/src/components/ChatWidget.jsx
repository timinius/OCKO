import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

function formatPrice(p) {
  return new Intl.NumberFormat('ru-RU').format(p) + ' ₽';
}

const SUGGESTIONS = [
  'Посоветуй смартфон до 50 000 ₽',
  'Ищу ноутбук для работы',
  'Что есть из спортивного инвентаря?',
  'Детские товары',
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Привет! 👋 Я помогу найти нужный товар на Флип. Что ищете?', products: [] },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0);
      const res = await api.post('/ai/chat', { message: msg, history });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply, products: res.data.products || [] }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: e.response?.data?.error || 'Произошла ошибка. Попробуйте позже.',
        products: [],
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="chat-widget-btn"
        style={{
          position: 'fixed', bottom: 24, right: 24, width: 56, height: 56,
          borderRadius: '50%', background: 'var(--red)', color: 'white',
          border: 'none', cursor: 'pointer', zIndex: 1000,
          boxShadow: '0 4px 16px rgba(192,57,43,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, transition: 'transform 0.2s, background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="AI-помощник по товарам"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat window */}
      {open && (
        <div className="chat-widget-window" style={{
          position: 'fixed', bottom: 92, right: 24, width: 360, height: 520,
          background: 'white', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', zIndex: 999, overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          {/* Header */}
          <div style={{
            background: 'var(--red)', color: 'white', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 22 }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>AI-помощник Флип</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>Подбираю товары под ваш запрос</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i}>
                <div style={{
                  display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '82%', padding: '9px 13px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? 'var(--red)' : '#F5F5F5',
                    color: msg.role === 'user' ? 'white' : 'var(--text)',
                    fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content}
                  </div>
                </div>
                {/* Product cards in message */}
                {msg.products && msg.products.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {msg.products.map(p => (
                      <Link key={p.id} to={`/product/${p.id}`} onClick={() => setOpen(false)}
                        style={{
                          display: 'flex', gap: 10, padding: '8px 10px', background: '#FAFAFA',
                          borderRadius: 10, border: '1px solid var(--border)', textDecoration: 'none',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <img src={p.image || 'https://via.placeholder.com/48'} alt=""
                          style={{ width: 48, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                          onError={e => e.target.style.display = 'none'}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>{formatPrice(p.price)}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {p.condition === 'new' ? 'Новый' : 'Б/у'} · {p.city}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: '#F5F5F5', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', fontSize: 18 }}>
                  <span style={{ animation: 'pulse 1s infinite' }}>•••</span>
                </div>
              </div>
            )}

            {/* Suggestions (only at start) */}
            {messages.length === 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    style={{
                      padding: '5px 10px', borderRadius: 20, border: '1.5px solid var(--border)',
                      background: 'white', fontSize: 11, cursor: 'pointer', color: 'var(--text)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Что ищете?"
              disabled={loading}
              style={{
                flex: 1, padding: '9px 12px', border: '1.5px solid var(--border)',
                borderRadius: 20, fontSize: 13, outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--red)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: '50%', background: input.trim() ? 'var(--red)' : 'var(--border)',
                border: 'none', color: 'white', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'background 0.2s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
      `}</style>
    </>
  );
}
