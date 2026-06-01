import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import {
  BookOpen, CheckSquare, Calendar, BarChart3,
  FileUp, Target, ArrowRight, GraduationCap
} from 'lucide-react';
import './LandingPage.css';

const FEATURES = [
  {
    icon: <GraduationCap size={28} />,
    title: 'Cursos e Matérias',
    desc: 'Organize toda a sua grade curricular, períodos e professores em um só lugar.',
    color: '#1d4ed8',
  },
  {
    icon: <CheckSquare size={28} />,
    title: 'Tarefas e Prazos',
    desc: 'Nunca perca uma entrega. Gerencie atividades, trabalhos e provas com alertas.',
    color: '#10b981',
  },
  {
    icon: <Calendar size={28} />,
    title: 'Rotinas de Estudo',
    desc: 'Monte uma rotina semanal personalizada e mantenha o ritmo de estudos.',
    color: '#f59e0b',
  },
  {
    icon: <BarChart3 size={28} />,
    title: 'Cronograma Visual',
    desc: 'Visualize tarefas e rotinas em uma view semanal clara e intuitiva.',
    color: '#1e3a8a',
  },
  {
    icon: <FileUp size={28} />,
    title: 'Importação por IA',
    desc: 'Faça upload do seu atestado de matrícula e o sistema monta tudo automaticamente.',
    color: '#4c3eff',
  },
  {
    icon: <Target size={28} />,
    title: 'Status Acadêmico',
    desc: 'Acompanhe o status de cada matéria: ativa, aprovada, reprovada ou pendente.',
    color: '#ef4444',
  },
];

const STEPS = [
  { num: '01', title: 'Cadastre seu curso', desc: 'Crie seu curso e adicione todas as matérias da sua grade curricular.' },
  { num: '02', title: 'Importe seu atestado', desc: 'Faça upload do PDF da sua matrícula. A IA detecta as matérias ativas e os horários.' },
  { num: '03', title: 'Estude com foco', desc: 'Suas rotinas e tarefas já estão organizadas. É só acompanhar e estudar.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) return null;

  return (
    <div className="landing">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-mark">
              <GraduationCap size={16} />
            </div>
            <span>StudyHub</span>
          </div>
          <div className="landing-nav-actions">
            <button className="btn-ghost" onClick={() => navigate('/login')}>
              Entrar
            </button>
            <button className="btn-primary-sm" onClick={() => navigate('/signup')}>
              Cadastrar grátis
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="hero-inner">
          <div className="hero-badge">Gestão acadêmica inteligente</div>
          <h1 className="hero-title">
            Organize sua vida<br />
            <span className="hero-gradient">universitária</span>
          </h1>
          <p className="hero-sub">
            Do atestado de matrícula às rotinas de estudo — tudo em uma só plataforma.
            Importe suas matérias automaticamente com IA e mantenha o foco no que importa.
          </p>
          <div className="hero-ctas">
            <button className="btn-hero-primary" onClick={() => navigate('/signup')}>
              Começar agora — é grátis
              <ArrowRight size={18} />
            </button>
            <button className="btn-hero-secondary" onClick={() => navigate('/login')}>
              Já tenho conta
            </button>
          </div>
          <p className="hero-hint">Sem cartão de crédito. Sem limite de matérias.</p>
        </div>

        {/* Card de preview */}
        <div className="hero-preview">
          <div className="preview-card">
            <div className="preview-header">
              <span className="preview-dot red" />
              <span className="preview-dot yellow" />
              <span className="preview-dot green" />
              <span className="preview-title-bar">Minhas Matérias — 2026/1</span>
            </div>
            <div className="preview-subjects">
              {[
                { name: 'Inteligência Artificial', status: 'ativa', period: '5º' },
                { name: 'Engenharia de Software I', status: 'ativa', period: '5º' },
                { name: 'Redes de Computadores I', status: 'ativa', period: '5º' },
                { name: 'Cálculo II', status: 'aprovada', period: '3º' },
                { name: 'Álgebra Linear', status: 'aprovada', period: '2º' },
              ].map((s, i) => (
                <div key={i} className="preview-subject-row">
                  <span className="preview-subject-name">{s.name}</span>
                  <span className={`preview-badge preview-badge-${s.status}`}>
                    {s.status === 'ativa' ? 'Ativa' : 'Aprovada'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className="landing-features">
        <div className="section-inner">
          <h2 className="section-title">Tudo que você precisa para estudar melhor</h2>
          <p className="section-sub">Uma plataforma completa pensada para universitários brasileiros.</p>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon" style={{ background: f.color + '18', color: f.color }}>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="landing-how">
        <div className="section-inner">
          <h2 className="section-title">Como funciona</h2>
          <p className="section-sub">Em 3 passos você já está estudando de forma organizada.</p>
          <div className="steps-row">
            {STEPS.map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {i < STEPS.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────────────────────── */}
      <section className="landing-cta">
        <div className="section-inner cta-inner">
          <h2>Pronto para organizar sua vida acadêmica?</h2>
          <p>Crie sua conta em segundos e comece a estudar com mais foco.</p>
          <button className="btn-hero-primary" onClick={() => navigate('/signup')}>
            Criar conta grátis
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="landing-logo">
            <div className="landing-logo-mark">
              <GraduationCap size={14} />
            </div>
            <span>StudyHub</span>
          </div>
          <p>Feito para universitários brasileiros.</p>
          <div className="footer-links">
            <button onClick={() => navigate('/login')}>Entrar</button>
            <button onClick={() => navigate('/signup')}>Cadastrar</button>
          </div>
        </div>
      </footer>

    </div>
  );
}

