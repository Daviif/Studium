import {
  BarChart3,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  BookMarked,
  LogOut,
  Plus,
  Sigma,
  LibraryBig
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesApi } from './services/api';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    university: '',
  });

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

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand-mark">
              <LibraryBig size={16} />
            </div>
            <span className="brand-name">StudyHub</span>
          </div>

          <nav className="menu">
            <button className="menu-item menu-item-active" type="button">
              <LayoutDashboard size={18} />
              <span>Visão Geral</span>
            </button>

            <button className="menu-item" onClick={() => navigate('/courses')} type="button">
              <BookMarked size={18} />
              <span>Cursos</span>
            </button>

            <button className="menu-item" onClick={() => navigate('/schedule')} type="button">
              <CalendarDays size={18} />
              <span>Cronograma</span>
            </button>

            <button className="menu-item" type="button">
              <BarChart3 size={18} />
              <span>Relatórios</span>
            </button>
          </nav>
        </div>

        <div className="profile-section">
          <button
            className="profile-button"
            onClick={() => navigate('/profile')}
            type="button"
            title="Meu Perfil"
          >
            <div className="profile">
              <div className="avatar">{getInitials(user?.name)}</div>
              <div>
                <p className="profile-name">{user?.name}</p>
                <p className="profile-role">{user?.email}</p>
              </div>
            </div>
          </button>

          <button className="logout-button" onClick={handleLogout} type="button" title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </div>
      
  );
}

export default App;