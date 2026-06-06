import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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

function parseUTCDate(str) {
  if (!str) return null;
  // SQLite stores CURRENT_TIMESTAMP as 'YYYY-MM-DD HH:MM:SS' without TZ — treat as UTC
  const s = str.includes('T') ? str : str.replace(' ', 'T') + 'Z';
  return new Date(s);
}

function getOnlineStatus(lastSeen) {
  if (!lastSeen) return null;
  const diff = Date.now() - parseUTCDate(lastSeen).getTime();
  if (diff < 5 * 60 * 1000) return { text: 'онлайн', online: true };
  if (diff < 60 * 60 * 1000) return { text: 'был(а) недавно', online: false };
  if (diff < 24 * 60 * 60 * 1000) return { text: 'сегодня', online: false };
  return { text: 'давно не заходил(а)', online: false };
}

function Initials({ name, avatar, size = 44, radius = '50%' }) {
  const [imgErr, setImgErr] = useState(false);
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.36, overflow: 'hidden', flexShrink: 0 }}>
      {avatar && !imgErr
        ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgErr(true)} />
        : initials}
    </div>
  );
}

function ProductThumb({ src }) {
  const [err, setErr] = useState(false);
  return (
    <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', background: 'var(--bg)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
      {src && !err
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
        : <span style={{ fontSize: 18 }}>📦</span>}
    </div>
  );
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

  // Poll new messages every 5 sec while dialog is open
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => loadMessages(active.id, false), 5000);
    return () => clearInterval(interval);
  }, [active?.id]);

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
    const data = res.data;
    setActive(data);
    const msgs = data.messages || [];
    setMessages(msgs);
    // Update sidebar: clear unread + update last_message
    const lastMsg = msgs[msgs.length - 1];
    setConversations(prev => prev.map(c => c.id === convId ? {
      ...c,
      unread_count: 0,
      last_message: lastMsg?.text ?? c.last_message,
      last_message_at: lastMsg?.created_at ?? c.last_message_at,
    } : c));
    // Tell Header to refresh unread badge
    window.dispatchEvent(new CustomEvent('chatMessagesRead'));
    if (scroll) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  async function openConv(conv) {
    await loadMessages(conv.id);
  }

  async function send() {
    if (!input.trim() || sending || !active) return;
    setSending(true);
    const msgText = input.trim();
    try {
      const res = await api.post(`/chat/conversations/${active.id}/messages`, { text: msgText });
      setMessages(prev => [...prev, res.data]);
      setInput('');
      // Update sidebar last_message immediately (no need for full reload)
      setConversations(prev => prev.map(c => c.id === active.id
        ? { ...c, last_message: msgText, last_message_at: res.data.created_at || new Date().toISOString() }
        : c
      ));
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  const isMe = active ? user.id === active.buyer_id : false;
  const otherName = active ? (isMe ? active.seller_name : active.buyer_name) : null;
  const otherAvatar = active ? (isMe ? active.seller_avatar : active.buyer_avatar) : null;
  const otherLastSeen = active ? (isMe ? active.seller_last_seen : active.buyer_last_seen) : null;
  const onlineStatus = getOnlineStatus(otherLastSeen);

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', justifyContent: 'center' }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: 1240, background: 'var(--bg)', overflow: 'hidden', boxShadow: '0 0 0 1px var(--border)' }}>

        {/* Список диалогов */}
        <div style={{
          width: 340, flexShrink: 0, background: 'white', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100%',
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
            const convIsMe = user.id === conv.buyer_id;
            const other = convIsMe ? conv.seller_name : conv.buyer_name;
            const otherAv = convIsMe ? conv.seller_avatar : conv.buyer_avatar;
            const isActive = active?.id === conv.id;
            return (
              <div key={conv.id} onClick={() => openConv(conv)}
                style={{
                  display: 'flex', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  background: isActive ? 'var(--primary-bg)' : 'white', transition: 'background 0.15s',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8faf8'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'white'; }}
              >
                {/* Аватар собеседника */}
                <Initials name={other} avatar={otherAv} size={46} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{other}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 4 }}>{formatTime(conv.last_message_at)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                    📦 {conv.product_title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: conv.last_message ? 'var(--text)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
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
            <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '12px 16px' }}>
              {/* Строка 1: аватар + имя собеседника + статус онлайн */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Initials name={otherName} avatar={otherAvatar} size={44} />
                  {onlineStatus?.online && (
                    <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, background: '#22c55e', border: '2px solid white', borderRadius: '50%' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{otherName}</div>
                  {onlineStatus && (
                    <div style={{ fontSize: 12, color: onlineStatus.online ? '#16a34a' : 'var(--text-secondary)', marginTop: 1 }}>
                      {onlineStatus.text}
                    </div>
                  )}
                </div>
              </div>
              {/* Строка 2: карточка товара */}
              <Link to={`/product/${active.product_id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg)', borderRadius: 10, textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e8f0ea'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}
              >
                <ProductThumb key={active.product_id} src={active.product_image} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{active.product_title}</div>
                  {active.product_price && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{new Intl.NumberFormat('ru-RU').format(active.product_price)} ₽</div>}
                </div>
                <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>К товару →</span>
              </Link>
            </div>

            {/* Сообщения */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: '100%', padding: '20px', gap: 10 }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, paddingBottom: 20 }}>
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
