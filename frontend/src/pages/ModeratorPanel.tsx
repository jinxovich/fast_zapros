import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { Chat, Order } from '../types';
import { Loader2, MessageSquare, Package, Send, ToggleLeft, ToggleRight } from 'lucide-react';

export function ModeratorPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [botToggleLoading, setBotToggleLoading] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [oRes, cRes] = await Promise.all([
        apiClient.get<Order[]>('/orders/all'),
        apiClient.get<Chat[]>('/chats/all'),
      ]);
      setOrders(oRes.data);
      setChats(cRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const sendModeratorMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId || !replyText.trim()) return;
    setSending(true);
    try {
      await apiClient.post(`/chats/${activeChatId}/moderator-message`, { content: replyText.trim() });
      setReplyText('');
      const cRes = await apiClient.get<Chat[]>('/chats/all');
      setChats(cRes.data);
    } catch {
      alert('Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  const toggleBot = async (chatId: number, isActive: boolean) => {
    setBotToggleLoading(chatId);
    try {
      await apiClient.post(`/chats/${chatId}/bot-toggle`, null, {
        params: { is_bot_active: isActive },
      });
      const cRes = await apiClient.get<Chat[]>('/chats/all');
      setChats(cRes.data);
    } catch {
      alert('Не удалось переключить бота');
    } finally {
      setBotToggleLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Package size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{orders.length}</div>
            <div className="stat-label">Всего заказов</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <MessageSquare size={28} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{chats.length}</div>
            <div className="stat-label">Активных чатов</div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <h2 className="section-title">
          <Package size={24} />
          Все заказы
        </h2>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Трек-номер</th>
                <th>Пользователь</th>
                <th>Статус</th>
                <th>Маршрут</th>
                <th>Вес</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Заказов пока нет
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      {o.tracking_number}
                    </td>
                    <td>User #{o.user_id}</td>
                    <td>
                      <span className={`status-badge ${o.status === 'created' ? 'created' : 'delivered'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      {o.origin} → {o.destination}
                    </td>
                    <td>{o.weight} кг</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-card">
        <h2 className="section-title">
          <MessageSquare size={24} />
          Чаты поддержки
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Список чатов
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {chats.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveChatId(c.id)}
                  style={{
                    padding: '1rem',
                    background: activeChatId === c.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-input)',
                    border: `1px solid ${activeChatId === c.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Чат #{c.id}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      User {c.user_id} · Бот {c.is_bot_active ? 'вкл' : 'выкл'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBot(c.id, !c.is_bot_active);
                    }}
                    disabled={botToggleLoading === c.id}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: c.is_bot_active ? '#10b981' : 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '0.5rem',
                    }}
                  >
                    {c.is_bot_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {activeChat && (
            <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Переписка
              </h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius)' }}>
                {(activeChat.messages ?? []).map((m) => (
                  <div key={m.id} style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      [{m.sender_role}]
                    </span>
                    <div style={{ color: 'var(--text-primary)', marginTop: '0.25rem' }}>{m.content}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendModeratorMessage} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  className="chat-input"
                  placeholder="Ответ модератора..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0 1.5rem' }}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}