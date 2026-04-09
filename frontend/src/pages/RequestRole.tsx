import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Shield, Loader2 } from 'lucide-react';
import type { User } from '../types';

export function RequestRole() {
  const { user, setUser } = useAuth();
  const [choice, setChoice] = useState<'moderator' | 'admin'>('moderator');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!user) return null;

  if (user.role !== 'user') {
    return (
      <p className="text-slate-500">
        Заявка доступна только обычным пользователям (роль user).
      </p>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await apiClient.post<User>('/auth/request-role', { role: choice });
      setUser(res.data);
      localStorage.setItem('user-info', JSON.stringify(res.data));
      setMessage('Заявка отправлена. Дождитесь одобрения администратора.');
    } catch {
      setMessage('Не удалось отправить заявку');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
      <h2 className="font-bold text-slate-800 flex items-center gap-2">
        <Shield size={22} />
        Заявка на роль
      </h2>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm text-slate-600">Роль</label>
        <select
          className="w-full px-3 py-2 border border-slate-200 rounded-lg"
          value={choice}
          onChange={(e) => setChoice(e.target.value as 'moderator' | 'admin')}
        >
          <option value="moderator">Модератор</option>
          <option value="admin">Администратор</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-slate-800 text-white rounded-lg font-medium flex justify-center gap-2"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          Отправить заявку
        </button>
      </form>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </div>
  );
}
