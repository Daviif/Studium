import { Outlet } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import DashboardLayout from './DashboardLayout.jsx';
import { SidebarProvider } from '../contexts/SidebarContext.jsx';

// Layout compartilhado para todas as rotas autenticadas.
// SidebarProvider único evita que o estado da sidebar reinicie ao navegar.
export default function AuthLayout() {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
