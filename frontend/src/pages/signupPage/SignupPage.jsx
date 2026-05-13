import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DefaultCoursesModal from '../../components/DefaultCoursesModal';
import '../loginPage/login.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCoursesModal, setShowCoursesModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('As senhas não conferem');
      return;
    }

    setLoading(true);

    const result = await register(
      formData.email,
      formData.password,
      formData.passwordConfirm,
      formData.name
    );

    if (result.success) {
      setShowCoursesModal(true);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <>
      {showCoursesModal && (
        <DefaultCoursesModal onClose={() => setShowCoursesModal(false)} />
      )}

      <div className="auth-split">

        {/* ── Painel esquerdo — Formulário ── */}
        <div className="auth-left">
          {/* Logo */}
          <div className="auth-logo">
            <span className="auth-logo-icon">S</span>
            <span className="auth-logo-name">Studium</span>
            <span className="auth-logo-tag">CADERNO</span>
          </div>

          {/* Cabeçalho */}
          <p className="auth-label">CRIAR CONTA</p>
          <h1 className="auth-heading">
            Comece o seu<br />
            <em>caderno</em>.
          </h1>
          <p className="auth-sub">
            Crie sua conta em segundos e organize toda a sua vida acadêmica.
          </p>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <p className="auth-error">{error}</p>}

            <div className="auth-field">
              <label className="auth-field-label">NOME COMPLETO</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="João Silva"
                className="auth-input"
                required
                disabled={loading}
              />
            </div>

            <div className="auth-field">
              <label className="auth-field-label">SEU EMAIL</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="exemplo@email.br"
                className="auth-input"
                required
                disabled={loading}
              />
            </div>

            <div className="auth-field">
              <label className="auth-field-label">SENHA</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="mínimo 6 caracteres"
                className="auth-input"
                required
                disabled={loading}
              />
            </div>

            <div className="auth-field">
              <label className="auth-field-label">CONFIRMAR SENHA</label>
              <input
                type="password"
                id="passwordConfirm"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                placeholder="repita a senha"
                className="auth-input"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta →'}
            </button>
          </form>

          <p className="auth-footer-link">
            Já tem conta?{' '}
            <button className="auth-link" onClick={() => navigate('/login')}>
              Entrar
            </button>
          </p>

          <p className="auth-copyright">
            © 2026 Studium · open-source · MIT
          </p>
        </div>

        {/* ── Painel direito — Branding ── */}
        <div className="auth-right">

          {/* Texto central */}
          <div className="auth-right-content">
            <p className="auth-right-eyebrow">NOVO POR AQUI · 2026.1</p>
            <h2 className="auth-right-heading">
              Seu histórico<br />
              acadêmico em<br />
              um só <em>lugar</em>.
            </h2>
            <p className="auth-right-sub">
              Importe seu atestado de matrícula, organize matérias por período
              e acompanhe cada entrega — do primeiro ao último semestre.
            </p>
          </div>

          {/* Métricas no rodapé */}
          <div className="auth-stats">
            <div className="auth-stat">
              <span className="auth-stat-value">1.2k</span>
              <span className="auth-stat-label">universitários</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">34</span>
              <span className="auth-stat-label">universidades</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">∞</span>
              <span className="auth-stat-label">matérias</span>
            </div>
          </div>

          {/* Círculos decorativos */}
          <div className="auth-deco auth-deco-1" />
          <div className="auth-deco auth-deco-2" />
        </div>

      </div>
    </>
  );
}
