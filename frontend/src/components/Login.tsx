import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Lock, Loader2, LogIn, Package } from 'lucide-react';
import { apiClient } from '../api/client';
import type { TokenResponse, User as UserType } from '../types';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const flash = (location.state as { message?: string } | null)?.message;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await apiClient.post<TokenResponse>('/auth/login', { username, password });
      const { access_token, user: userData } = response.data;
      login(access_token, userData as UserType);
      navigate('/', { replace: true });
    } catch (err: any) {
      if (err.response?.status === 401) setError('Неверный логин или пароль');
      else setError('Ошибка подключения к серверу');
    } finally { setIsLoading(false); }
  };

  const fill = (u: string, p: string) => { setUsername(u); setPassword(p); };

  return (
    <div className="auth-wrapper">
      <div className="auth-card fade-in">
        <div className="auth-logo">LogisticAI</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Вход в систему управления логистикой</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Логин</label>
            <div className="input-group">
              <User size={18} />
              <input className="auth-input" placeholder="Введите логин" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <div className="input-group">
              <Lock size={18} />
              <input type="password" className="auth-input" placeholder="Введите пароль" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}

          <button className="btn-primary" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Войти <LogIn size={18} /></>}
          </button>
        </form>

        <div className="test-creds">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Тестовые доступы:</p>
          <div>
            <button onClick={() => fill('admin', 'root')}>admin:root</button>
            <button onClick={() => fill('user', 'user')}>user:user</button>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            Нет аккаунта? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Регистрация</Link>
          </p>
        </div>
      </div>
    </div>
  );
};