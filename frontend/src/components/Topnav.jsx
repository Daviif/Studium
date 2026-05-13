import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Search, LogOut } from 'lucide-react';
import { useState } from 'react';
import '../styles/Topnav.css';

const NAV_LINKS = [
  { label: 'Visão geral', path: '/dashboard' },
  { label: 'Cursos',      path: '/courses'   },
  { label: 'Cronograma',  path: '/schedule'  },
  { label: 'Rotinas',     path: '/routines'  },
];

export default function Topnav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'US';

  const isActive = (path) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="topnav">
      <div className="topnav-inner">

        {/* Logo */}
        <button className="topnav-logo" onClick={() => navigate('/dashboard')}>
          <span className="topnav-logo-icon">S</span>
          <span className="topnav-logo-name">Studium</span>
          <span className="topnav-logo-season">2026.1</span>
        </button>

        {/* Nav links */}
        <div className="topnav-links">
          {NAV_LINKS.map(link => (
            <button
              key={link.path}
              className={`topnav-link ${isActive(link.path) ? 'topnav-link--active' : ''}`}
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="topnav-right">
          <div className="topnav-search">
            <Search size={14} />
            <span>Buscar matéria, tarefa...</span>
            <kbd>⌘K</kbd>
          </div>

          <button className="topnav-bell" title="Notificações">
            <Bell size={17} />
            <span className="topnav-bell-dot" />
          </button>

          <div className="topnav-user-wrap">
            <button
              className="topnav-user"
              onClick={() => setUserMenuOpen(o => !o)}
            >
              <span className="topnav-avatar">{initials}</span>
              <span className="topnav-username">{user?.name?.split(' ')[0] ?? 'Usuário'}</span>
              <span className="topnav-caret">▾</span>
            </button>

            {userMenuOpen && (
              <div className="topnav-dropdown" onMouseLeave={() => setUserMenuOpen(false)}>
                <button onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}>
                  Meu perfil
                </button>
                <button onClick={handleLogout} className="topnav-dropdown-danger">
                  <LogOut size={14} /> Sair
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
}
