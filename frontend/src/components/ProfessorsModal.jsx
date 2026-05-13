import { useState, useEffect } from 'react';
import { X, UserPlus, Users, Trash2, Check } from 'lucide-react';
import { professorsApi, subjectsApi } from '../services/api';
import '../styles/ProfessorsModal.css';

const AVATAR_COLORS = [
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#d1fae5', color: '#065f46' },
  { bg: '#fef3c7', color: '#92400e' },
  { bg: '#f3e8ff', color: '#7c3aed' },
  { bg: '#fce7f3', color: '#9d174d' },
];

function initials(name) {
  return (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function ProfessorsModal({ subjectId, isOpen, onClose, token, onProfessorSelected }) {
  const [professors,    setProfessors]    = useState([]);
  const [allProfessors, setAllProfessors] = useState([]);
  const [tab,           setTab]           = useState('existing'); // 'existing' | 'new'
  const [selProfId,     setSelProfId]     = useState('');
  const [semestre,      setSemestre]      = useState('2026/1');
  const [newName,       setNewName]       = useState('');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  useEffect(() => {
    if (isOpen && subjectId) { load(); }
  }, [isOpen, subjectId]);

  async function load() {
    try {
      setLoading(true); setError('');
      const [psRes, allRes] = await Promise.all([
        subjectsApi.getProfessors(subjectId, token),
        professorsApi.list(token),
      ]);
      setProfessors(Array.isArray(psRes.data) ? psRes.data : []);
      setAllProfessors(Array.isArray(allRes.data) ? allRes.data : []);
    } catch { setError('Erro ao carregar professores.'); }
    finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!selProfId || !semestre.trim()) { setError('Selecione um professor e informe o semestre.'); return; }
    try {
      setLoading(true); setError('');
      await subjectsApi.addProfessor(subjectId, { professorId: parseInt(selProfId), semestre }, token);
      setSelProfId('');
      await load();
    } catch (err) { setError(err.response?.data?.error || 'Erro ao adicionar professor.'); }
    finally { setLoading(false); }
  }

  async function handleCreateAndAdd() {
    if (!newName.trim() || !semestre.trim()) { setError('Informe o nome e o semestre.'); return; }
    try {
      setLoading(true); setError('');
      const res = await professorsApi.create({ name: newName.trim(), email: null }, token);
      await subjectsApi.addProfessor(subjectId, { professorId: res.data.id, semestre }, token);
      setNewName(''); setTab('existing');
      await load();
    } catch (err) { setError(err.response?.data?.error || 'Erro ao criar professor.'); }
    finally { setLoading(false); }
  }

  async function handleRemove(professorSubjectId) {
    if (!confirm('Remover este professor da matéria?')) return;
    try {
      setLoading(true);
      await subjectsApi.removeProfessor(subjectId, professorSubjectId, token);
      await load();
    } catch { setError('Erro ao remover professor.'); }
    finally { setLoading(false); }
  }

  function handleSelect(ps) {
    onProfessorSelected?.(ps);
    onClose?.();
  }

  if (!isOpen) return null;

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="pm-header">
          <div className="pm-header-left">
            <Users size={18} />
            <h2>Professores</h2>
          </div>
          <button className="pm-close" onClick={onClose}><X size={16}/></button>
        </div>

        {error && <div className="pm-error">{error}</div>}

        {/* ── Professores associados ── */}
        <div className="pm-section">
          <p className="pm-section-label">ASSOCIADOS</p>

          {loading && professors.length === 0 ? (
            <p className="pm-empty">Carregando…</p>
          ) : professors.length === 0 ? (
            <div className="pm-empty">
              <UserPlus size={28}/>
              <p>Nenhum professor associado.</p>
            </div>
          ) : (
            <div className="pm-prof-list">
              {professors.map((ps, i) => {
                const col = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <div key={ps.id} className="pm-prof-row">
                    <div className="pm-avatar" style={{ background: col.bg, color: col.color }}>
                      {initials(ps.professor.name)}
                    </div>
                    <div className="pm-prof-info">
                      <span className="pm-prof-name">{ps.professor.name}</span>
                      <span className="pm-prof-sem">{ps.semestre}</span>
                    </div>
                    <div className="pm-prof-actions">
                      <button
                        className="pm-use-btn"
                        onClick={() => handleSelect(ps)}
                        title="Usar este professor"
                      >
                        <Check size={13}/> Usar
                      </button>
                      <button
                        className="pm-del-btn"
                        onClick={() => handleRemove(ps.id)}
                        disabled={loading}
                        title="Remover"
                      >
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pm-divider"/>

        {/* ── Adicionar ── */}
        <div className="pm-section">
          <p className="pm-section-label">ADICIONAR</p>

          {/* Tabs */}
          <div className="pm-tabs">
            <button
              className={`pm-tab ${tab === 'existing' ? 'active' : ''}`}
              onClick={() => { setTab('existing'); setError(''); }}
            >
              Professor existente
            </button>
            <button
              className={`pm-tab ${tab === 'new' ? 'active' : ''}`}
              onClick={() => { setTab('new'); setError(''); }}
            >
              Novo professor
            </button>
          </div>

          {tab === 'existing' ? (
            <div className="pm-form">
              <div className="pm-field">
                <label>PROFESSOR</label>
                <select
                  value={selProfId}
                  onChange={e => setSelProfId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Selecione…</option>
                  {allProfessors.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="pm-field">
                <label>SEMESTRE</label>
                <input
                  value={semestre}
                  onChange={e => setSemestre(e.target.value)}
                  placeholder="Ex: 2026/1"
                  disabled={loading}
                />
              </div>
              <button
                className="pm-save-btn"
                onClick={handleAdd}
                disabled={loading || !selProfId}
              >
                {loading ? 'Adicionando…' : 'Adicionar Professor'}
              </button>
            </div>
          ) : (
            <div className="pm-form">
              <div className="pm-field">
                <label>NOME DO PROFESSOR</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ex: Prof. João Silva"
                  disabled={loading}
                />
              </div>
              <div className="pm-field">
                <label>SEMESTRE</label>
                <input
                  value={semestre}
                  onChange={e => setSemestre(e.target.value)}
                  placeholder="Ex: 2026/1"
                  disabled={loading}
                />
              </div>
              <button
                className="pm-save-btn"
                onClick={handleCreateAndAdd}
                disabled={loading || !newName.trim()}
              >
                {loading ? 'Criando…' : 'Criar e Adicionar'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
