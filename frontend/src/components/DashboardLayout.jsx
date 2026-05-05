import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useSidebar } from '../contexts/SidebarContext';
import '../styles/DashboardLayout.css';

export default function DashboardLayout({ children }) {
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <div className="dashboard-layout">
      <Sidebar />
      {!isOpen && (
        <button 
          className="toggle-sidebar-button"
          onClick={toggleSidebar}
          title="Abrir sidebar"
        >
          <Menu size={20} />
        </button>
      )}
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
