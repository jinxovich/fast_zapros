import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { User } from '../types';
import { Check, Loader2, Shield } from 'lucide-react';

export function AdminPanel() {
  const [pending, setPending] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<User[]>('/auth/requests');
      setPending(res.data);
    } catch {
      setPending([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (userId: number) => {
    setApproving(userId);
    try {
      await apiClient.post(`/auth/approve/${userId}`);
      await load();
    } catch {
      alert('Не удалось одобрить заявку');
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Shield size={28} />
        Заявки на роли
      </h1>
      <p className="text-slate-500 text-sm">
        Одобрение переводит пользователя из pending_moderator в moderator или из pending_admin в admin.
      </p>
      <ul className="space-y-3">
        {pending.length === 0 ? (
          <li className="text-slate-400 text-center py-8 bg-white rounded-xl border border-slate-200">
            Нет активных заявок
          </li>
        ) : (
          pending.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
            >
              <div>
                <p className="font-semibold text-slate-800">{u.username}</p>
                <p className="text-xs text-slate-500 uppercase">{u.role}</p>
              </div>
              <button
                type="button"
                onClick={() => approve(u.id)}
                disabled={approving === u.id}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {approving === u.id ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Одобрить
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
