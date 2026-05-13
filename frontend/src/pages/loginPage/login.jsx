import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './login.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
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
        <p className="auth-label">ENTRAR</p>
        <h1 className="auth-heading">
          Volte ao seu<br />
          <em>caderno</em>.
        </h1>
        <p className="auth-sub">
          Organize matérias, professores, tarefas e materiais em um único lugar.
        </p>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="auth-error">{error}</p>}

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
              className="auth-input"
              required
            />
          </div>

          <div className="auth-remember">
            <label>
              <input type="checkbox" /> Lembrar-me
            </label>
            <button type="button" className="auth-link">Esqueci a senha</button>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>

           <p className="auth-footer-link">
          Não tem conta?{' '}
          <button className="auth-link" onClick={() => navigate('/signup')}>
            Criar conta
          </button>
        </p>

        </form>

       

        <p className="auth-copyright">
          © 2026 Studium · open-source · MIT
        </p>
      </div>

      {/* ── Painel direito — Branding ── */}
      <div className="auth-right">

        {/* Texto central */}
        <div className="auth-right-content">
          <p className="auth-right-eyebrow">ESTAÇÃO · 2026.1</p>
          <h2 className="auth-right-heading">
            Um caderno<br />
            <em>vivo</em> para a<br />
            vida acadêmica.
          </h2>
          <p className="auth-right-sub">
            Suas matérias, seus professores, suas entregas —
            costuradas em uma única timeline, do primeiro ao último período.
          </p>
        </div>

        {/* Métricas no rodapé */}
        <div className="auth-stats">
          <div className="auth-stat">
            <span className="auth-stat-value">1.2k</span>
            <span className="auth-stat-label">universitários</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-value">1</span>
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
        <div className="auth-deco auth-deco-3" />
      </div>

    </div>
  );
}
