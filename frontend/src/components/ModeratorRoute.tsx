import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ModeratorRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
