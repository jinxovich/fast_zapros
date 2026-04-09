import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import { UserPlus, Loader2 } from 'lucide-react';

export function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const flash = (location.state as { message?: string } | null)?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/auth/register', { username, password });
      navigate('/login', { state: { message: 'Аккаунт создан. Войдите.' } });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) setError('Пользователь уже существует');
      else setError('Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Регистрация</h1>
        </div>
        {flash && <p className="text-sm text-emerald-600 text-center mb-4">{flash}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full px-4 py-3 border border-slate-200 rounded-xl"
            placeholder="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold flex justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" />}
            Зарегистрироваться
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-slate-500">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-blue-600 font-medium">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
