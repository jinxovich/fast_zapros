import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CLIENT_ROLES = new Set(['user', 'pending_moderator', 'pending_admin']);

export function ClientRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || !CLIENT_ROLES.has(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
