import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

function formatTime(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'только что';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function Chats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initConvId = searchParams.get('conv');

  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (initConvId && conversations.length > 0) {
      const found = conversations.find(c => c.id === parseInt(initConvId));
      if (found) openConv(found);
    }
  }, [initConvId, conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Поллинг новых сообщений каждые 5 сек
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => loadMessages(active.id, false), 5000);
    return () => clearInterval(interval);
  }, [active]);

  async function loadConversations() {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(convId, scroll = true) {
    const res = await api.get(`/chat/conversations/${convId}`);
    setActive(res.data);
    setMessages(res.data.messages || []);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c));
    if (scroll) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  async function openConv(conv) {
    await loadMessages(conv.id);
  }

  async function send() {
    if (!input.trim() || sending || !active) return;
    setSending(true);
    try {
      const res = await api.post(`/chat/conversations/${active.id}/messages`, { text: input.trim() });
      setMessages(prev => [...prev, res.data]);
      setInput('');
      loadConversations();
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  const otherName = active
    ? (user.id === active.buyer_id ? active.seller_name : active.buyer_name)
    : null;

  return (
    <div className="page" style={{ padding: '0' }}>
      <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: 'var(--bg)' }}>

        {/* Список диалогов */}
        <div style={{
          width: 340, flexShrink: 0, background: 'white', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }} className="chats-sidebar">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: 18 }}>
            Сообщения
          </div>

          {loading ? (
            <div className="spinner" />
          ) : conversations.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon">💬</div>
              <h3>Нет диалогов</h3>
              <p style={{ fontSize: 13 }}>Напишите продавцу со страницы товара</p>
            </div>
          ) : conversations.map(conv => {
            const isMe = user.id === conv.buyer_id;
            const other = isMe ? conv.seller_name : conv.buyer_name;
            const isActive = active?.id === conv.id;
            return (
              <div key={conv.id} onClick={() => openConv(conv)}
                style={{
                  display: 'flex', gap: 12, padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  background: isActive ? 'var(--primary-bg)' : 'white', transition: 'background 0.15s',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8faf8'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'white'; }}
              >
                {/* Фото товара */}
                <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  {conv.product_image
                    ? <img src={conv.product_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📦</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{other}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 4 }}>{formatTime(conv.last_message_at)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                    {conv.product_title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: conv.last_message ? 'var(--text)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                      {conv.last_message || 'Нет сообщений'}
                    </span>
                    {conv.unread_count > 0 && (
                      <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', minWidth: 20, height: 20, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '0 4px' }}>
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Область сообщений */}
        {active ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Шапка диалога */}
            <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                {active.product_image
                  ? <img src={active.product_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{otherName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  По товару: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{active.product_title}</span>
                  {active.product_price && <span style={{ color: 'var(--accent)', marginLeft: 8, fontWeight: 700 }}>{new Intl.NumberFormat('ru-RU').format(active.product_price)} ₽</span>}
                </div>
              </div>
            </div>

            {/* Сообщения */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, margin: 'auto' }}>
                  Начните диалог — напишите вопрос по товару
                </div>
              )}
              {messages.map(msg => {
                const isOwn = msg.sender_id === user.id;
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px',
                      borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isOwn ? 'var(--primary)' : 'white',
                      color: isOwn ? 'white' : 'var(--text)',
                      boxShadow: 'var(--shadow)',
                      border: isOwn ? 'none' : '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</div>
                      <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7, textAlign: 'right' }}>{formatTime(msg.created_at)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Поле ввода */}
            <div style={{ background: 'white', borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Напишите сообщение... (Enter — отправить)"
                rows={1}
                style={{
                  flex: 1, padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 12,
                  fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                  maxHeight: 120, overflowY: 'auto', transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button onClick={send} disabled={!input.trim() || sending}
                style={{
                  width: 42, height: 42, borderRadius: '50%', border: 'none',
                  background: input.trim() ? 'var(--primary)' : 'var(--border)',
                  color: 'white', cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.2s',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 56 }}>💬</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Выберите диалог</div>
            <div style={{ fontSize: 14 }}>или напишите продавцу со страницы товара</div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .chats-sidebar { width: 100% !important; border-right: none !important; display: ${active ? 'none' : 'flex'} !important; }
        }
      `}</style>
    </div>
  );
}
