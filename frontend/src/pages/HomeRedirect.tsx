import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'moderator':
      return <Navigate to="/moderator" replace />;
    default:
      return <Navigate to="/chat" replace />;
  }
}
