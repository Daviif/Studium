import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Trash2, Wand2, X, History, FileUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { coursesApi, subjectsApi } from '../services/api';
import EnrollmentUploadModal from '../components/EnrollmentUploadModal';
import './CourseDetails.css';

const STATUS_LABELS = {
  PENDENTE:   'Pendente',
  ATIVA:      'Ativa',
  APROVADA:   'Aprovada',
  REPROVADA:  'Reprovada',
  TRANCADA:   'Trancada',
  DISPENSADA: 'Dispensada',
};

const STATUS_OPTIONS = [
  { value: 'ATIVA',      label: 'Ativa — matriculado neste semestre' },
  { value: 'APROVADA',   label: 'Aprovada — concluída com sucesso' },
  { value: 'REPROVADA',  label: 'Reprovada — cursou e reprovou' },
  { value: 'TRANCADA',   label: 'Trancada — matrícula trancada' },
  { value: 'PENDENTE',   label: 'Pendente — ainda não cursou' },
  { value: 'DISPENSADA', label: 'Dispensada — aproveitamento de estudos' },
];

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [course, setCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal: nova matéria
  const [formData, setFormData] = useState({ name: '', period: '', type: 'OBRIGATORIA' });

  // Modal: alterar status
  const [statusModal, setStatusModal] = useState({ open: false, subject: null });
  const [statusForm, setStatusForm] = useState({ status: 'ATIVA', semester: '', note: '' });

  // Modal: histórico
  const [historyModal, setHistoryModal] = useState({ open: false, subject: null, entries: [] });

  // Modal: importar atestado
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);

  // Modal: configuração rápida
  const [quickSetupOpen, setQuickSetupOpen] = useState(false);
  const [quickSetupForm, setQuickSetupForm] = useState({ currentPeriod: '', semester: '' });
  const [quickSetupPreview, setQuickSetupPreview] = useState(null);

  useEffect(() => {
    loadCourseDetails();
  }, [courseId, token]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const courseResponse = await coursesApi.get(courseId, token);
      setCourse(courseResponse.data);
      const subjectsResponse = await subjectsApi.list(courseId, token);
      setSubjects(Array.isArray(subjectsResponse.data) ? subjectsResponse.data : []);
    } catch (err) {
      console.error('Erro ao carregar curso:', err);
      setError('Não foi possível carregar o curso');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) { setError('Nome da matéria é obrigatório'); return; }

    try {
      setIsSaving(true);
      setError('');
      await subjectsApi.create({ name, period: formData.period || null, type: formData.type, courseId: parseInt(courseId) }, token);
      setFormData({ name: '', period: '', type: 'OBRIGATORIA' });
      setIsModalOpen(false);
      await loadCourseDetails();
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao criar matéria. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm(`Tem certeza que deseja deletar o curso "${course.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      setIsSaving(true);
      await coursesApi.delete(courseId, token);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao deletar curso. Tente novamente.');
      setIsSaving(false);
    }
  };

  // ── Status ──────────────────────────────────────────────────────────────────

  const openStatusModal = (subject) => {
    setStatusForm({ status: subject.status || 'PENDENTE', semester: '', note: '' });
    setStatusModal({ open: true, subject });
  };

  const handleStatusSave = async () => {
    if (!statusModal.subject) return;
    try {
      setIsSaving(true);
      await subjectsApi.updateStatus(statusModal.subject.id, statusForm, token);
      setStatusModal({ open: false, subject: null });
      await loadCourseDetails();
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao alterar status.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Histórico ────────────────────────────────────────────────────────────────

  const openHistoryModal = async (e, subject) => {
    e.stopPropagation();
    try {
      const res = await subjectsApi.getHistory(subject.id, token);
      setHistoryModal({ open: true, subject, entries: res.data });
    } catch {
      setError('Erro ao carregar histórico.');
    }
  };

  // ── Configuração Rápida ──────────────────────────────────────────────────────

  const computeQuickSetupPreview = (period) => {
    const current = parseInt(period);
    if (!current || current < 1) { setQuickSetupPreview(null); return; }

    const preview = subjects
      .filter(s => s.type === 'OBRIGATORIA' && s.period)
      .map(s => {
        const p = parseInt(s.period);
        let newStatus = 'PENDENTE';
        if (!isNaN(p)) {
          if (p < current) newStatus = 'APROVADA';
          else if (p === current) newStatus = 'ATIVA';
        }
        return { ...s, newStatus, willChange: s.status !== newStatus };
      });

    setQuickSetupPreview(preview);
  };

  const handleQuickSetup = async () => {
    const current = parseInt(quickSetupForm.currentPeriod);
    if (!current || current < 1) { setError('Informe um período válido.'); return; }
    try {
      setIsSaving(true);
      await subjectsApi.classifyByPeriod(
        { courseId: parseInt(courseId), currentPeriod: current, semester: quickSetupForm.semester || null },
        token
      );
      setQuickSetupOpen(false);
      setQuickSetupForm({ currentPeriod: '', semester: '' });
      setQuickSetupPreview(null);
      await loadCourseDetails();
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro na configuração rápida.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) return <div className="course-details-container"><p>Carregando...</p></div>;
  if (!course) return (
    <div className="course-details-container">
      <button className="back-button" onClick={() => navigate('/courses')}><ArrowLeft size={20} /> Voltar</button>
      <p>Curso não encontrado</p>
    </div>
  );

  return (
    <div className="course-details-container">
      <div className="course-details-header">
        <button className="back-button" onClick={() => navigate('/courses')} title="Voltar">
          <ArrowLeft size={20} />
        </button>

        <div className="course-info">
          <h1>{course.name}</h1>
          <p>{course.university}</p>
        </div>

        <button className="upload-enrollment-btn" onClick={() => setEnrollmentOpen(true)} title="Importar atestado de matrícula">
          <FileUp size={18} />
          Importar Atestado
        </button>

        <button className="quick-setup-btn" onClick={() => setQuickSetupOpen(true)} title="Classificar matérias por período">
          <Wand2 size={18} />
          Configuração Rápida
        </button>

        <button className="add-subject-button" onClick={() => setIsModalOpen(true)} type="button">
          <Plus size={18} />
          Nova Matéria
        </button>

        <button className="delete-course-button" onClick={handleDeleteCourse} type="button" title="Deletar curso" disabled={isSaving}>
          <Trash2 size={18} />
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="subjects-section">
        <h2>Matérias</h2>

        {subjects.length === 0 ? (
          <div className="empty-subjects">
            <div className="empty-icon"><BookOpen size={32} /></div>
            <p>Nenhuma matéria cadastrada</p>
            <button className="primary-button" onClick={() => setIsModalOpen(true)} type="button">
              Adicionar Primeira Matéria
            </button>
          </div>
        ) : (
          <div className="subjects-by-period">
            {(() => {
              const normalizedSubjects = subjects.map(s => ({ ...s, type: s.type || 'OBRIGATORIA' }));
              const obrigatorias = normalizedSubjects.filter(s => s.type === 'OBRIGATORIA');
              const naoObrigatorias = normalizedSubjects.filter(s => s.type !== 'OBRIGATORIA');

              const groupedObrigatorias = obrigatorias.reduce((groups, subject) => {
                const period = subject.period || 'sem-periodo';
                if (!groups[period]) groups[period] = [];
                groups[period].push(subject);
                return groups;
              }, {});

              const periodosOrdenados = Object.keys(groupedObrigatorias)
                .filter(p => p !== 'sem-periodo')
                .sort((a, b) => { const nA = parseInt(a), nB = parseInt(b); return (!isNaN(nA) && !isNaN(nB)) ? nA - nB : 0; });
              if (groupedObrigatorias['sem-periodo']) periodosOrdenados.push('sem-periodo');

              const groupedNaoObrigatorias = {};
              const tiposOrdenados = ['ELETIVA', 'OPTATIVA', 'FACULTATIVA', 'EXTENSAO'];
              tiposOrdenados.forEach(tipo => {
                const subs = naoObrigatorias.filter(s => s.type === tipo);
                if (subs.length > 0) {
                  groupedNaoObrigatorias[tipo] = subs.reduce((groups, subject) => {
                    const period = subject.period || 'sem-periodo';
                    if (!groups[period]) groups[period] = [];
                    groups[period].push(subject);
                    return groups;
                  }, {});
                }
              });

              const allGroups = [];
              periodosOrdenados.forEach(p => allGroups.push({
                key: `obrigatorio-${p}`,
                label: p === 'sem-periodo' ? 'Sem Período' : `${p}º Período`,
                items: groupedObrigatorias[p],
                isObrigatorio: true
              }));

              tiposOrdenados.forEach(tipo => {
                if (groupedNaoObrigatorias[tipo]) {
                  const labels = { ELETIVA: 'Eletiva', OPTATIVA: 'Optativa', FACULTATIVA: 'Facultativa', EXTENSAO: 'Extensão' };
                  const periodosDoTipo = Object.keys(groupedNaoObrigatorias[tipo])
                    .filter(p => p !== 'sem-periodo')
                    .sort((a, b) => { const nA = parseInt(a), nB = parseInt(b); return (!isNaN(nA) && !isNaN(nB)) ? nA - nB : 0; });
                  if (groupedNaoObrigatorias[tipo]['sem-periodo']) periodosDoTipo.push('sem-periodo');
                  allGroups.push({
                    key: `tipo-${tipo}`,
                    label: labels[tipo],
                    items: [],
                    isMainType: true,
                    subGroups: periodosDoTipo.map(p => ({
                      key: `${tipo}-${p}`,
                      label: p === 'sem-periodo' ? 'Sem Período' : `${p}º Período`,
                      items: groupedNaoObrigatorias[tipo][p]
                    }))
                  });
                }
              });

              const renderSubjectCard = (subject) => (
                <div
                  key={subject.id}
                  className="subject-card"
                  onClick={() => navigate(`/courses/${courseId}/subjects/${subject.id}`)}
                >
                  <div className="subject-card-top">
                    <h3>{subject.name}</h3>
                    <div className="subject-card-actions" onClick={e => e.stopPropagation()}>
                      <button
                        className={`status-badge status-${(subject.status || 'PENDENTE').toLowerCase()}`}
                        onClick={() => openStatusModal(subject)}
                        title="Alterar status"
                      >
                        {STATUS_LABELS[subject.status] || 'Pendente'}
                      </button>
                      <button
                        className="history-btn"
                        onClick={(e) => openHistoryModal(e, subject)}
                        title="Histórico de status"
                      >
                        <History size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="subject-tasks">{subject.professorSubjects?.length || 0} professor(es)</p>
                </div>
              );

              return allGroups.map(group => (
                <div key={group.key}>
                  <div className="period-group">
                    <h3 className="period-title">{group.label}</h3>
                    {!group.isMainType && <div className="subjects-grid">{group.items.map(renderSubjectCard)}</div>}
                  </div>
                  {group.isMainType && group.subGroups && (
                    <div className="sub-periods">
                      {group.subGroups.map(subGroup => (
                        <div key={subGroup.key} className="period-group" style={{ marginLeft: '16px' }}>
                          <h4 className="sub-period-title">{subGroup.label}</h4>
                          <div className="subjects-grid">{subGroup.items.map(renderSubjectCard)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Modal: Importar Atestado */}
      {enrollmentOpen && (
        <EnrollmentUploadModal
          courseId={parseInt(courseId)}
          token={token}
          onClose={() => setEnrollmentOpen(false)}
          onSuccess={loadCourseDetails}
        />
      )}

      {/* Modal: Nova Matéria */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => !isSaving && setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nova Matéria</h2>
            <p>Adicione uma matéria ao curso "{course.name}"</p>
            <form onSubmit={handleCreateSubject}>
              <label htmlFor="subject-name">Nome da Matéria</label>
              <input id="subject-name" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Cálculo I" disabled={isSaving} />
              <label htmlFor="subject-period">Período</label>
              <input id="subject-period" type="text" value={formData.period} onChange={e => setFormData({ ...formData, period: e.target.value })} placeholder="Ex: 1" disabled={isSaving} />
              <label htmlFor="subject-type">Tipo</label>
              <select id="subject-type" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} disabled={isSaving}>
                <option value="OBRIGATORIA">Obrigatória</option>
                <option value="ELETIVA">Eletiva</option>
                <option value="OPTATIVA">Optativa</option>
                <option value="FACULTATIVA">Facultativa</option>
                <option value="EXTENSAO">Extensão</option>
              </select>
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</button>
                <button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Matéria'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Alterar Status */}
      {statusModal.open && (
        <div className="modal-backdrop" onClick={() => !isSaving && setStatusModal({ open: false, subject: null })}>
          <div className="modal modal-status" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Alterar Status</h2>
              <button className="modal-close-btn" onClick={() => setStatusModal({ open: false, subject: null })}><X size={18} /></button>
            </div>
            <p className="modal-subtitle">{statusModal.subject?.name}</p>

            <div className="status-options-grid">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`status-option-btn status-${opt.value.toLowerCase()} ${statusForm.status === opt.value ? 'selected' : ''}`}
                  onClick={() => setStatusForm({ ...statusForm, status: opt.value })}
                >
                  <span className="status-dot" />
                  {opt.label}
                </button>
              ))}
            </div>

            <label htmlFor="status-semester">Semestre (opcional)</label>
            <input
              id="status-semester"
              type="text"
              placeholder="Ex: 2026/1"
              value={statusForm.semester}
              onChange={e => setStatusForm({ ...statusForm, semester: e.target.value })}
            />

            <label htmlFor="status-note">Observação (opcional)</label>
            <input
              id="status-note"
              type="text"
              placeholder="Ex: Aprovado com média 7.5"
              value={statusForm.note}
              onChange={e => setStatusForm({ ...statusForm, note: e.target.value })}
            />

            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setStatusModal({ open: false, subject: null })} disabled={isSaving}>Cancelar</button>
              <button className="primary-button" onClick={handleStatusSave} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Histórico de Status */}
      {historyModal.open && (
        <div className="modal-backdrop" onClick={() => setHistoryModal({ open: false, subject: null, entries: [] })}>
          <div className="modal modal-history" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Histórico de Status</h2>
              <button className="modal-close-btn" onClick={() => setHistoryModal({ open: false, subject: null, entries: [] })}><X size={18} /></button>
            </div>
            <p className="modal-subtitle">{historyModal.subject?.name}</p>

            {historyModal.entries.length === 0 ? (
              <p className="history-empty">Nenhuma alteração registrada ainda.</p>
            ) : (
              <div className="history-list">
                {historyModal.entries.map(entry => (
                  <div key={entry.id} className="history-entry">
                    <span className={`status-badge status-${(entry.status || 'pendente').toLowerCase()}`}>{STATUS_LABELS[entry.status] || entry.status}</span>
                    <div className="history-meta">
                      {entry.semester && <span>{entry.semester}</span>}
                      {entry.note && <span className="history-note">{entry.note}</span>}
                      <span className="history-date">{new Date(entry.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Configuração Rápida */}
      {quickSetupOpen && (
        <div className="modal-backdrop" onClick={() => !isSaving && setQuickSetupOpen(false)}>
          <div className="modal modal-quicksetup" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Configuração Rápida</h2>
              <button className="modal-close-btn" onClick={() => setQuickSetupOpen(false)}><X size={18} /></button>
            </div>
            <p className="modal-subtitle">
              Classifica automaticamente as matérias obrigatórias com período definido:
              anteriores ao período atual → <strong>Aprovada</strong>, período atual → <strong>Ativa</strong>, posteriores → <strong>Pendente</strong>.
            </p>

            <label htmlFor="qs-period">Meu período atual</label>
            <input
              id="qs-period"
              type="number"
              min="1"
              max="12"
              placeholder="Ex: 5"
              value={quickSetupForm.currentPeriod}
              onChange={e => {
                setQuickSetupForm({ ...quickSetupForm, currentPeriod: e.target.value });
                computeQuickSetupPreview(e.target.value);
              }}
            />

            <label htmlFor="qs-semester">Semestre atual (opcional)</label>
            <input
              id="qs-semester"
              type="text"
              placeholder="Ex: 2026/1"
              value={quickSetupForm.semester}
              onChange={e => setQuickSetupForm({ ...quickSetupForm, semester: e.target.value })}
            />

            {quickSetupPreview && quickSetupPreview.length > 0 && (
              <div className="quicksetup-preview">
                <p className="preview-title">Prévia das mudanças ({quickSetupPreview.filter(s => s.willChange).length} alterações):</p>
                <div className="preview-list">
                  {quickSetupPreview.filter(s => s.willChange).map(s => (
                    <div key={s.id} className="preview-row">
                      <span className="preview-name">{s.name}</span>
                      <span className={`status-badge status-${(s.status || 'pendente').toLowerCase()}`}>{STATUS_LABELS[s.status] || 'Pendente'}</span>
                      <span className="preview-arrow">→</span>
                      <span className={`status-badge status-${(s.newStatus || 'pendente').toLowerCase()}`}>{STATUS_LABELS[s.newStatus] || 'Pendente'}</span>
                    </div>
                  ))}
                  {quickSetupPreview.filter(s => s.willChange).length === 0 && (
                    <p style={{ color: '#60779a', fontSize: '14px' }}>Nenhuma alteração necessária.</p>
                  )}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setQuickSetupOpen(false)} disabled={isSaving}>Cancelar</button>
              <button
                className="primary-button"
                onClick={handleQuickSetup}
                disabled={isSaving || !quickSetupForm.currentPeriod}
              >
                {isSaving ? 'Classificando...' : 'Aplicar Classificação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
