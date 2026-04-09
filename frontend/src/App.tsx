import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { AppLayout } from './components/AppLayout';
import { RequireAuth } from './components/RequireAuth';
import { ClientRoute } from './components/ClientRoute';
import { ModeratorRoute } from './components/ModeratorRoute';
import { AdminRoute } from './components/AdminRoute';
import { AIChat } from './components/AIChat';
import { UserOrders } from './pages/UserOrders';
import { ModeratorPanel } from './pages/ModeratorPanel';
import { AdminPanel } from './pages/AdminPanel';
import { Register } from './pages/Register';
import { RequestRole } from './pages/RequestRole';
import { HomeRedirect } from './pages/HomeRedirect';
import { Architecture } from './pages/Architecture';
import { ArchitectureDiagram } from './pages/ArchitectureDiagram';
import './App.css';

// Компонент маршрута логина
function LoginRoute() {
  const { user, isReady } = useAuth();
  if (!isReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Загрузка…
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

// Компонент маршрута регистрации
function RegisterRoute() {
  const { user, isReady } = useAuth();
  if (!isReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Загрузка…
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <Register />;
}

// Основная конфигурация роутинга
function AppRoutes() {
  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/register" element={<RegisterRoute />} />
      
      {/* Маршруты архитектуры (доступны без логина для презентации) */}
      <Route path="/architecture" element={<Architecture />} />
      <Route path="/architecture-diagram" element={<ArchitectureDiagram />} />

      {/* Защищенные маршруты (требуют авторизации) */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomeRedirect />} />
          
          <Route
            path="chat"
            element={
              <ClientRoute>
                <div className="w-full max-w-3xl">
                  <AIChat />
                </div>
              </ClientRoute>
            }
          />
          
          <Route
            path="orders"
            element={
              <ClientRoute>
                <UserOrders />
              </ClientRoute>
            }
          />
          
          <Route
            path="request-role"
            element={
              <ClientRoute>
                <RequestRole />
              </ClientRoute>
            }
          />
          
          <Route
            path="moderator"
            element={
              <ModeratorRoute>
                <ModeratorPanel />
              </ModeratorRoute>
            }
          />
          
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
        </Route>
      </Route>

      {/* Редирект на главную при неверном пути */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}