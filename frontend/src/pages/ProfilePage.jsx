import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, User, Lock, LogOut, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import './Profile.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    notifyDaysBefore: 1,
    quietHoursStart: 22,
    quietHoursEnd: 8,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!profileData.name.trim()) {
      setError('Nome não pode estar vazio');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await authApi.updateProfile({ name: profileData.name }, token);
      
      setSuccess('Perfil atualizado com sucesso!');
      setIsEditingProfile(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Preencha todos os campos de senha');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, token);
      
      setSuccess('Senha alterada com sucesso!');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao alterar senha. Verifique sua senha atual.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      logout();
      navigate('/login');
    }
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
    <div className="profile-container">
      <div className="profile-header">
        <button className="back-button" onClick={() => navigate('/')} title="Voltar">
          <ArrowLeft size={20} />
        </button>

        <div className="profile-title">
          <h1>Meu Perfil</h1>
          <p>Gerenciar informações da conta</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="profile-content">
        {/* Avatar e Nome */}
        <div className="profile-card avatar-card">
          <div className="avatar-large">{getInitials(user?.name)}</div>
          <div className="avatar-info">
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
          </div>
        </div>

        {/* Editar Perfil */}
        <div className="profile-card">
          <div className="card-header">
            <h3>Informações da Conta</h3>
            {!isEditingProfile && (
              <button
                className="edit-btn"
                onClick={() => setIsEditingProfile(true)}
              >
                Editar
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleEditProfile} className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Nome Completo</label>
                <input
                  id="name"
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                  placeholder="Digite seu nome"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="disabled-field"
                />
                <small>Email não pode ser alterado</small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsEditingProfile(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">
                  <User size={18} />
                  Nome
                </span>
                <span className="info-value">{profileData.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">
                  <Mail size={18} />
                  Email
                </span>
                <span className="info-value">{profileData.email}</span>
              </div>
            </div>
          )}
        </div>

        {/* Preferências de Notificações */}
        <div className="profile-card">
          <div className="card-header">
            <h3>Preferências de Notificações</h3>
          </div>
          
          <div className="preferences-form">
            <div className="preference-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  defaultChecked={prefs.emailNotifications}
                />
                <span>Receber notificações por email</span>
              </label>
            </div>
            
            <div className="preference-group">
              <label htmlFor="days">Notificar com antecedência</label>
              <div className="input-with-label">
                <input 
                  id="days"
                  type="number" 
                  min="0" 
                  max="7" 
                  defaultValue={prefs.notifyDaysBefore}
                  className="small-input"
                />
                <span className="input-suffix">dias antes</span>
              </div>
            </div>
            
            <div className="preference-group">
              <label>Horas de silêncio</label>
              <div className="time-range">
                <input 
                  type="time" 
                  defaultValue={`${String(prefs.quietHoursStart).padStart(2, '0')}:00`}
                  className="time-input"
                />
                <span className="time-separator">até</span>
                <input 
                  type="time" 
                  defaultValue={`${String(prefs.quietHoursEnd).padStart(2, '0')}:00`}
                  className="time-input"
                />
              </div>
              <small>Durante este período, você não receberá notificações</small>
            </div>
          </div>
        </div>

        {/* Mudar Senha */}
        <div className="profile-card">
          <div className="card-header">
            <h3>Segurança</h3>
            {!isChangingPassword && (
              <button
                className="edit-btn"
                onClick={() => setIsChangingPassword(true)}
              >
                Alterar Senha
              </button>
            )}
          </div>

          {isChangingPassword ? (
            <form onSubmit={handleChangePassword} className="profile-form">
              <div className="form-group">
                <label htmlFor="current-password">Senha Atual</label>
                <input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  placeholder="Digite sua senha atual"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-password">Nova Senha</label>
                <input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Digite uma nova senha"
                  disabled={loading}
                />
                <small>Mínimo de 6 caracteres</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirmar Nova Senha</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirme a nova senha"
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsChangingPassword(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading}
                >
                  {loading ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </div>
            </form>
          ) : (
            <div className="security-info">
              <p>Mantenha sua senha segura e única.</p>
              <ul className="security-tips">
                <li>Use pelo menos 8 caracteres</li>
                <li>Inclua letras maiúsculas e minúsculas</li>
                <li>Inclua números e caracteres especiais</li>
                <li>Não use informações pessoais óbvias</li>
              </ul>
            </div>
          )}
        </div>

        {/* Ações Perigosas */}
        <div className="profile-card danger-zone">
          <h3>Zona de Perigo</h3>
          
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            Sair da Conta
          </button>

          <button className="delete-btn" disabled title="Recurso em breve">
            <X size={18} />
            Deletar Conta
          </button>
          <small>Funcionalidade em breve</small>
        </div>
      </div>
    </div>
  );
}
