import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { Order } from '../types';
import { Package, Search, Plus, Loader2 } from 'lucide-react';

export function UserOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ origin: '', destination: '', weight: '' });
  const [lookup, setLookup] = useState('');
  const [result, setResult] = useState<Order | null>(null);


  const load = async () => {
    try {
      const response = await apiClient.get<Order[]>('/orders/my');
      setOrders(response.data);
    } catch (error: any) {
      console.error('Ошибка загрузки заказов:', error);
      if (error.response?.status === 401) {
        window.location.href = '/login';
      } else if (error.response?.status === 404) {
        alert('Эндпоинт не найден. Проверь, что бэкенд запущен.');
      } else {
        alert('Не удалось загрузить заказы. Проверь консоль.');
      }
    } finally {
      setLoading(false);
    }
  };;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiClient.post('/orders', { ...form, weight: parseFloat(form.weight) });
    setForm({ origin: '', destination: '', weight: '' });
    load();
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await apiClient.get<Order>(`/orders/${lookup}`);
      setResult(r.data);
    } catch { setResult(null); }
  };

  return (
    <div className="main-content fade-in">
      <div className="page-header">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Мои заказы</h1>
        <button className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.2rem' }} onClick={() => document.getElementById('create-form')?.scrollIntoView({ behavior: 'smooth' })}>
          <Plus size={16} /> Новый заказ
        </button>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title"><Search size={20} /> Поиск</div>
          <form onSubmit={search} style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="auth-input" style={{ padding: '0.6rem' }} placeholder="TRK-XXXXX" value={lookup} onChange={e => setLookup(e.target.value)} />
            <button className="btn-primary" style={{ width: 'auto', padding: '0 1rem' }}>Найти</button>
          </form>
          {result && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.9rem' }}>
              <p><strong>Трек:</strong> {result.tracking_number}</p>
              <p><strong>Статус:</strong> {result.status}</p>
            </div>
          )}
        </div>

        <div className="card" id="create-form">
          <div className="card-title"><Plus size={20} /> Создать заказ</div>
          <form onSubmit={create}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Откуда</label>
                <input className="auth-input" style={{ padding: '0.6rem' }} placeholder="Город" value={form.origin} onChange={e => setForm({...form, origin: e.target.value})} required />
              </div>
              <div>
                <label className="form-label">Куда</label>
                <input className="auth-input" style={{ padding: '0.6rem' }} placeholder="Город" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Вес (кг)</label>
              <input className="auth-input" type="number" step="0.1" placeholder="0.0" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} required />
            </div>
            <button className="btn-primary">Оформить</button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-title"><Package size={20} /> История</div>
        {loading ? <div style={{ textAlign: 'center' }}><Loader2 className="animate-spin" /></div> : (
          <table className="table">
            <thead>
              <tr>
                <th>Трек-номер</th>
                <th>Маршрут</th>
                <th>Вес</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Заказов пока нет</td></tr> : 
                orders.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>{o.tracking_number}</td>
                    <td>{o.origin} → {o.destination}</td>
                    <td>{o.weight} кг</td>
                    <td><span className={`status-badge ${o.status === 'created' ? 'created' : 'delivered'}`}>{o.status}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}