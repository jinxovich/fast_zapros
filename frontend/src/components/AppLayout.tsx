import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Package, MessageSquare, ClipboardList, Shield, Users, Network } from 'lucide-react';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const isClient = user.role === 'user' || user.role === 'pending_moderator' || user.role === 'pending_admin';
  const isModerator = user.role === 'moderator' || user.role === 'admin';
  const isAdmin = user.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <Link to="/" className="logo">
            <Package size={28} />
            <span>LogisticAI</span>
          </Link>
          
          <nav className="nav-menu">
            {isClient && (
              <>
                <Link className="nav-link" to="/chat">
                  <MessageSquare size={18} />
                  <span>Чат</span>
                </Link>
                <Link className="nav-link" to="/orders">
                  <ClipboardList size={18} />
                  <span>Заказы</span>
                </Link>
                {user.role === 'user' && (
                  <Link className="nav-link" to="/request-role">
                    <Shield size={18} />
                    <span>Заявка на роль</span>
                  </Link>
                )}
              </>
            )}
            {isModerator && (
              <Link className="nav-link" to="/moderator">
                <Users size={18} />
                <span>Модерация</span>
              </Link>
            )}
            {isAdmin && (
              <Link className="nav-link" to="/admin">
                <Shield size={18} />
                <span>Админ-панель</span>
              </Link>
            )}
            
            {/* 🔗 Группа ссылок на архитектуру */}
            <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)' }}>
              <Link className="nav-link" to="/architecture" title="Карточки с описанием">
                <Network size={18} />
                <span>Архитектура</span>
              </Link>
              <Link className="nav-link" to="/architecture-diagram" title="Интерактивная схема">
                <Network size={18} />
                <span>Схема</span>
              </Link>
            </div>
          </nav>
        </div>

        <div className="user-menu">
          <div className="user-info">
            <div className="user-name">{user.username}</div>
            <div className="role-badge">{user.role}</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="logout-btn"
            title="Выйти"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}