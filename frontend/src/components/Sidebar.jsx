import {
  BarChart3,
  CalendarDays,
  BookMarked,
  LogOut,
  LibraryBig,
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import '../styles/Sidebar.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isOpen, toggleSidebar } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'US';
  };

  const getActiveClass = (path) => {
    const currentPath = window.location.pathname;
    if (path === '/' && currentPath === '/') return 'menu-item-active';
    if (path !== '/' && currentPath.startsWith(path)) return 'menu-item-active';
    return '';
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={toggleSidebar}
        />
      )}
      
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Header com toggle */}
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-mark">
              <LibraryBig size={16} />
            </div>
            <span className="brand-name">StudyHub</span>
          </div>
          <button 
            className="toggle-button"
            onClick={toggleSidebar}
            title={isOpen ? 'Fechar sidebar' : 'Abrir sidebar'}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu */}
        <nav className="menu">
          <button 
            className={`menu-item ${getActiveClass('/')}`}
            onClick={() => navigate('/')}
            type="button"
            title="Visão Geral"
          >
            <LayoutDashboard size={18} />
            <span>Visão Geral</span>
          </button>

          <button 
            className={`menu-item ${getActiveClass('/courses')}`}
            onClick={() => navigate('/courses')} 
            type="button"
            title="Cursos"
          >
            <BookMarked size={18} />
            <span>Cursos</span>
          </button>

          <button 
            className={`menu-item ${getActiveClass('/schedule')}`}
            onClick={() => navigate('/schedule')} 
            type="button"
            title="Cronograma"
          >
            <CalendarDays size={18} />
            <span>Cronograma</span>
          </button>

          <button className="menu-item" type="button" title="Relatórios">
            <BarChart3 size={18} />
            <span>Relatórios</span>
          </button>
        </nav>

        {/* Profile Section */}
        <div className="profile-section">
          <button
            className="profile-button"
            onClick={() => navigate('/profile')}
            type="button"
            title="Meu Perfil"
          >
            <div className="profile">
              <div className="avatar">{getInitials(user?.name)}</div>
              <div className="profile-info">
                <p className="profile-name">{user?.name}</p>
                <p className="profile-role">{user?.email}</p>
              </div>
            </div>
          </button>

          <button 
            className="logout-button" 
            onClick={handleLogout} 
            type="button" 
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
