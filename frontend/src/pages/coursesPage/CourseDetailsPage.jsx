import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Trash2, Wand2, X, History, FileUp, Edit2, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { coursesApi, subjectsApi } from '../../services/api';
import EnrollmentUploadModal from '../../components/EnrollmentUploadModal';
import './CourseDetails.css';

const STATUS_LABELS = {
  PENDENTE: 'Pendente', ATIVA: 'Ativa', APROVADA: 'Aprovada',
  REPROVADA: 'Reprovada', TRANCADA: 'Trancada', DISPENSADA: 'Dispensada',
};

const STATUS_OPTIONS = [
  { value: 'ATIVA',      label: 'Ativa — matriculado neste semestre' },
  { value: 'APROVADA',   label: 'Aprovada — concluída com sucesso' },
  { value: 'REPROVADA',  label: 'Reprovada — cursou e reprovou' },
  { value: 'TRANCADA',   label: 'Trancada — matrícula trancada' },
  { value: 'PENDENTE',   label: 'Pendente — ainda não cursou' },
  { value: 'DISPENSADA', label: 'Dispensada — aproveitamento de estudos' },
];

const TYPE_LABELS = {
  OBRIGATORIA: 'Obrigatória', ELETIVA: 'Eletiva',
  OPTATIVA: 'Optativa', FACULTATIVA: 'Facultativa', EXTENSAO: 'Extensão',
};

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const navigate    = useNavigate();
  const { token }   = useAuth();

  const [course,           setCourse]           = useState(null);
  const [subjects,         setSubjects]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [isModalOpen,      setIsModalOpen]      = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [isSaving,         setIsSaving]         = useState(false);
  const [formData,         setFormData]         = useState({ name: '', period: '', type: 'OBRIGATORIA' });
  const [statusModal,      setStatusModal]      = useState({ open: false, subject: null });
  const [statusForm,       setStatusForm]       = useState({ status: 'ATIVA', semester: '', note: '' });
  const [historyModal,     setHistoryModal]     = useState({ open: false, subject: null, entries: [] });
  const [enrollmentOpen,   setEnrollmentOpen]   = useState(false);
  const [quickSetupOpen,   setQuickSetupOpen]   = useState(false);
  const [quickSetupForm,   setQuickSetupForm]   = useState({ currentPeriod: '', semester: '' });
  const [quickSetupPreview,setQuickSetupPreview]= useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [courseId, token]);

  async function load() {
    try {
      setLoading(true); setError('');
      const [cr, sr] = await Promise.all([
        coursesApi.get(courseId, token),
        subjectsApi.list(courseId, token),
      ]);
      setCourse(cr.data);
      setSubjects(Array.isArray(sr.data) ? sr.data : []);
    } catch { setError('Não foi possível carregar o curso.'); }
    finally { setLoading(false); }
  }

  async function handleSaveSubject(e) {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) { setError('Nome é obrigatório.'); return; }
    try {
      setIsSaving(true); setError('');
      if (editingSubjectId) {
        await subjectsApi.update(editingSubjectId, { name, period: formData.period || null, type: formData.type }, token);
      } else {
        await subjectsApi.create({ name, period: formData.period || null, type: formData.type, courseId: parseInt(courseId) }, token);
      }
      setIsModalOpen(false); setEditingSubjectId(null);
      setFormData({ name: '', period: '', type: 'OBRIGATORIA' });
      await load();
    } catch (err) { setError(err?.response?.data?.error || 'Erro ao salvar.'); }
    finally { setIsSaving(false); }
  }

  function openEditSubject(subject) {
    setEditingSubjectId(subject.id);
    setFormData({ name: subject.name, period: subject.period || '', type: subject.type || 'OBRIGATORIA' });
    setError(''); setIsModalOpen(true);
  }

  async function handleDeleteSubject(id) {
    if (!confirm('Deletar esta matéria? Esta ação não pode ser desfeita.')) return;
    try { await subjectsApi.delete(id, token); await load(); }
    catch (err) { setError(err?.response?.data?.error || 'Erro ao deletar.'); }
  }

  async function handleDeleteCourse() {
    if (!confirm(`Deletar o curso "${course.name}"? Todas as matérias serão removidas.`)) return;
    try { setIsSaving(true); await coursesApi.delete(courseId, token); navigate('/courses'); }
    catch (err) { setError(err?.response?.data?.error || 'Erro ao deletar.'); setIsSaving(false); }
  }

  async function handleStatusSave() {
    if (!statusModal.subject) return;
    try {
      setIsSaving(true);
      await subjectsApi.updateStatus(statusModal.subject.id, statusForm, token);
      setStatusModal({ open: false, subject: null });
      await load();
    } catch (err) { setError(err?.response?.data?.error || 'Erro ao alterar status.'); }
    finally { setIsSaving(false); }
  }

  async function openHistoryModal(e, subject) {
    e.stopPropagation();
    try {
      const res = await subjectsApi.getHistory(subject.id, token);
      setHistoryModal({ open: true, subject, entries: res.data });
    } catch { setError('Erro ao carregar histórico.'); }
  }

  function computePreview(period) {
    const cur = parseInt(period);
    if (!cur || cur < 1) { setQuickSetupPreview(null); return; }
    setQuickSetupPreview(
      subjects.filter(s => s.type === 'OBRIGATORIA' && s.period).map(s => {
        const p = parseInt(s.period);
        const newStatus = isNaN(p) ? 'PENDENTE' : p < cur ? 'APROVADA' : p === cur ? 'ATIVA' : 'PENDENTE';
        return { ...s, newStatus, willChange: s.status !== newStatus };
      })
    );
  }

  async function handleQuickSetup() {
    const cur = parseInt(quickSetupForm.currentPeriod);
    if (!cur || cur < 1) { setError('Informe um período válido.'); return; }
    try {
      setIsSaving(true);
      await subjectsApi.classifyByPeriod({ courseId: parseInt(courseId), currentPeriod: cur, semester: quickSetupForm.semester || null }, token);
      setQuickSetupOpen(false); setQuickSetupForm({ currentPeriod: '', semester: '' }); setQuickSetupPreview(null);
      await load();
    } catch (err) { setError(err?.response?.data?.error || 'Erro.'); }
    finally { setIsSaving(false); }
  }

  // ── Agrupamento de matérias ────────────────────────────
  function buildGroups() {
    const norm = subjects.map(s => ({ ...s, type: s.type || 'OBRIGATORIA' }));
    const obrig = norm.filter(s => s.type === 'OBRIGATORIA');
    const outros = norm.filter(s => s.type !== 'OBRIGATORIA');
    const TIPO_LABELS = { ELETIVA:'Eletiva', OPTATIVA:'Optativa', FACULTATIVA:'Facultativa', EXTENSAO:'Extensão' };

    const byPeriod = obrig.reduce((acc, s) => {
      const k = s.period || 'sem-periodo'; if (!acc[k]) acc[k] = []; acc[k].push(s); return acc;
    }, {});

    const periods = Object.keys(byPeriod).filter(p => p !== 'sem-periodo')
      .sort((a, b) => parseInt(a) - parseInt(b));
    if (byPeriod['sem-periodo']) periods.push('sem-periodo');

    const groups = periods.map(p => ({
      key: `p-${p}`, label: p === 'sem-periodo' ? 'Sem Período' : `${p}º Período`,
      items: byPeriod[p],
    }));

    ['ELETIVA','OPTATIVA','FACULTATIVA','EXTENSAO'].forEach(tipo => {
      const subs = outros.filter(s => s.type === tipo);
      if (subs.length) groups.push({ key: `t-${tipo}`, label: TIPO_LABELS[tipo], items: subs });
    });

    return groups;
  }

  // ── Render ─────────────────────────────────────────────
  if (loading) return <div className="cd-page"><div className="cd-loading">Carregando…</div></div>;
  if (!course)  return (
    <div className="cd-page">
      <button className="cd-back" onClick={() => navigate('/courses')}><ArrowLeft size={18}/>Voltar</button>
      <p style={{color:'#6b7280',padding:'32px'}}>Curso não encontrado.</p>
    </div>
  );

  const groups = buildGroups();

  return (
    <div className="cd-page">
      <div className="cd-inner">

        {/* ── Cabeçalho ── */}
        <div className="cd-header">
          <button className="cd-back" onClick={() => navigate('/courses')} title="Voltar">
            <ArrowLeft size={17}/>
          </button>
          <div className="cd-course-info">
            <h1 className="cd-course-name">{course.name}</h1>
            <p className="cd-course-uni">{course.university}</p>
          </div>
          <div className="cd-actions">
            <button className="cd-action-outline" onClick={() => setEnrollmentOpen(true)} title="Importar atestado">
              <FileUp size={15}/><span>Atestado</span>
            </button>
            <button className="cd-action-outline" onClick={() => setQuickSetupOpen(true)} title="Configuração rápida">
              <Wand2 size={15}/><span>Config. Rápida</span>
            </button>
            <button className="cd-action-primary" onClick={() => { setEditingSubjectId(null); setFormData({ name:'', period:'', type:'OBRIGATORIA' }); setIsModalOpen(true); }}>
              <Plus size={15}/> Nova Matéria
            </button>
            <button className="cd-action-del" onClick={handleDeleteCourse} disabled={isSaving} title="Deletar curso">
              <Trash2 size={15}/>
            </button>
          </div>
        </div>

        {error && <div className="cd-error">{error}</div>}

        {/* ── Matérias ── */}
        <div className="cd-content">
          <div className="cd-section-hdr">
            <h2 className="cd-section-title">Matérias <span>{subjects.length}</span></h2>
          </div>

          {subjects.length === 0 ? (
            <div className="cd-empty">
              <div className="cd-empty-icon"><BookOpen size={32}/></div>
              <p className="cd-empty-title">Nenhuma matéria cadastrada</p>
              <p className="cd-empty-sub">Adicione manualmente ou importe pelo atestado de matrícula.</p>
              <button className="cd-action-primary" onClick={() => setIsModalOpen(true)}>
                <Plus size={14}/> Adicionar Matéria
              </button>
            </div>
          ) : (
            <div className="cd-groups">
              {groups.map(group => (
                <div key={group.key} className="cd-group">
                  <div className="cd-group-label">
                    <span>{group.label}</span>
                    <span className="cd-group-count">{group.items.length}</span>
                  </div>
                  <div className="cd-subjects-grid">
                    {group.items.map(subject => (
                      <div
                        key={subject.id}
                        className="cd-subject-card"
                        onClick={() => navigate(`/courses/${courseId}/subjects/${subject.id}`)}
                      >
                        {/* Status + ações */}
                        <div className="cd-card-top" onClick={e => e.stopPropagation()}>
                          <button
                            className={`cd-status-pill cd-s-${(subject.status || 'PENDENTE').toLowerCase()}`}
                            onClick={() => { setStatusForm({ status: subject.status || 'PENDENTE', semester: '', note: '' }); setStatusModal({ open: true, subject }); }}
                            title="Alterar status"
                          >
                            {STATUS_LABELS[subject.status] || 'Pendente'}
                          </button>
                          <div className="cd-card-btns">
                            <button className="cd-card-btn" onClick={e => openHistoryModal(e, subject)} title="Histórico">
                              <History size={13}/>
                            </button>
                            <button className="cd-card-btn" onClick={() => openEditSubject(subject)} title="Editar">
                              <Edit2 size={13}/>
                            </button>
                            <button className="cd-card-btn cd-card-btn-del" onClick={() => handleDeleteSubject(subject.id)} title="Deletar">
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </div>

                        {/* Corpo */}
                        <div className="cd-card-body">
                          <h3 className="cd-card-name">{subject.name}</h3>
                          <div className="cd-card-meta">
                            {subject.period && <span>{subject.period}º per.</span>}
                            <span>{subject.professorSubjects?.length || 0} prof.</span>
                          </div>
                        </div>

                        {/* Rodapé */}
                        <div className="cd-card-foot">
                          <span className="cd-type-chip">{TYPE_LABELS[subject.type] || subject.type}</span>
                          <ChevronRight size={14} className="cd-card-arrow"/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Importar Atestado ── */}
      {enrollmentOpen && (
        <EnrollmentUploadModal
          courseId={parseInt(courseId)}
          token={token}
          onClose={() => setEnrollmentOpen(false)}
          onSuccess={load}
        />
      )}

      {/* ── Modal: Nova/Editar Matéria ── */}
      {isModalOpen && (
        <div className="cd-overlay" onClick={() => !isSaving && setIsModalOpen(false)}>
          <div className="cd-modal" onClick={e => e.stopPropagation()}>
            <div className="cd-modal-hdr">
              <h2>{editingSubjectId ? 'Editar Matéria' : 'Nova Matéria'}</h2>
              <button className="cd-modal-close" onClick={() => { setIsModalOpen(false); setEditingSubjectId(null); }}><X size={17}/></button>
            </div>
            <p className="cd-modal-sub">{editingSubjectId ? 'Atualize os dados da matéria.' : `Adicione uma matéria a "${course.name}"`}</p>
            <form onSubmit={handleSaveSubject}>
              <div className="cd-field"><label>NOME DA MATÉRIA</label>
                <input value={formData.name} onChange={e => setFormData(p=>({...p,name:e.target.value}))} placeholder="Ex: Cálculo I" disabled={isSaving}/>
              </div>
              <div className="cd-field-row">
                <div className="cd-field"><label>PERÍODO</label>
                  <input value={formData.period} onChange={e => setFormData(p=>({...p,period:e.target.value}))} placeholder="Ex: 3" disabled={isSaving}/>
                </div>
                <div className="cd-field"><label>TIPO</label>
                  <select value={formData.type} onChange={e => setFormData(p=>({...p,type:e.target.value}))} disabled={isSaving}>
                    <option value="OBRIGATORIA">Obrigatória</option>
                    <option value="ELETIVA">Eletiva</option>
                    <option value="OPTATIVA">Optativa</option>
                    <option value="FACULTATIVA">Facultativa</option>
                    <option value="EXTENSAO">Extensão</option>
                  </select>
                </div>
              </div>
              <div className="cd-modal-actions">
                <button type="button" className="cd-btn-cancel" onClick={() => { setIsModalOpen(false); setEditingSubjectId(null); }} disabled={isSaving}>Cancelar</button>
                <button type="submit" className="cd-btn-save" disabled={isSaving}>{isSaving ? 'Salvando…' : editingSubjectId ? 'Atualizar' : 'Criar Matéria'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Alterar Status ── */}
      {statusModal.open && (
        <div className="cd-overlay" onClick={() => !isSaving && setStatusModal({ open:false, subject:null })}>
          <div className="cd-modal" onClick={e => e.stopPropagation()}>
            <div className="cd-modal-hdr">
              <h2>Alterar Status</h2>
              <button className="cd-modal-close" onClick={() => setStatusModal({ open:false, subject:null })}><X size={17}/></button>
            </div>
            <p className="cd-modal-sub">{statusModal.subject?.name}</p>
            <div className="cd-status-grid">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`cd-status-opt cd-s-${opt.value.toLowerCase()} ${statusForm.status === opt.value ? 'selected' : ''}`}
                  onClick={() => setStatusForm(p=>({...p,status:opt.value}))}
                >
                  <span className="cd-status-dot"/>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="cd-field-row" style={{marginTop:16}}>
              <div className="cd-field"><label>SEMESTRE (opcional)</label>
                <input value={statusForm.semester} onChange={e=>setStatusForm(p=>({...p,semester:e.target.value}))} placeholder="Ex: 2026/1"/>
              </div>
              <div className="cd-field"><label>OBSERVAÇÃO (opcional)</label>
                <input value={statusForm.note} onChange={e=>setStatusForm(p=>({...p,note:e.target.value}))} placeholder="Ex: Nota 7.5"/>
              </div>
            </div>
            <div className="cd-modal-actions">
              <button className="cd-btn-cancel" onClick={() => setStatusModal({ open:false, subject:null })} disabled={isSaving}>Cancelar</button>
              <button className="cd-btn-save" onClick={handleStatusSave} disabled={isSaving}>{isSaving ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Histórico ── */}
      {historyModal.open && (
        <div className="cd-overlay" onClick={() => setHistoryModal({ open:false, subject:null, entries:[] })}>
          <div className="cd-modal" onClick={e => e.stopPropagation()}>
            <div className="cd-modal-hdr">
              <h2>Histórico</h2>
              <button className="cd-modal-close" onClick={() => setHistoryModal({ open:false, subject:null, entries:[] })}><X size={17}/></button>
            </div>
            <p className="cd-modal-sub">{historyModal.subject?.name}</p>
            {historyModal.entries.length === 0
              ? <p className="cd-hist-empty">Nenhuma alteração registrada.</p>
              : <div className="cd-hist-list">
                  {historyModal.entries.map(e => (
                    <div key={e.id} className="cd-hist-row">
                      <span className={`cd-status-pill cd-s-${(e.status||'pendente').toLowerCase()}`}>{STATUS_LABELS[e.status]||e.status}</span>
                      <div className="cd-hist-meta">
                        {e.semester && <span>{e.semester}</span>}
                        {e.note && <span className="cd-hist-note">{e.note}</span>}
                        <span className="cd-hist-date">{new Date(e.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      )}

      {/* ── Modal: Configuração Rápida ── */}
      {quickSetupOpen && (
        <div className="cd-overlay" onClick={() => !isSaving && setQuickSetupOpen(false)}>
          <div className="cd-modal" onClick={e => e.stopPropagation()}>
            <div className="cd-modal-hdr">
              <h2>Configuração Rápida</h2>
              <button className="cd-modal-close" onClick={() => setQuickSetupOpen(false)}><X size={17}/></button>
            </div>
            <p className="cd-modal-sub">Classifica automaticamente as obrigatórias: anteriores → Aprovada · atual → Ativa · posteriores → Pendente.</p>
            <div className="cd-field-row">
              <div className="cd-field"><label>MEU PERÍODO ATUAL</label>
                <input type="number" min="1" max="12" placeholder="Ex: 5" value={quickSetupForm.currentPeriod}
                  onChange={e=>{ setQuickSetupForm(p=>({...p,currentPeriod:e.target.value})); computePreview(e.target.value); }}/>
              </div>
              <div className="cd-field"><label>SEMESTRE (opcional)</label>
                <input placeholder="Ex: 2026/1" value={quickSetupForm.semester}
                  onChange={e=>setQuickSetupForm(p=>({...p,semester:e.target.value}))}/>
              </div>
            </div>
            {quickSetupPreview && quickSetupPreview.filter(s=>s.willChange).length > 0 && (
              <div className="cd-preview">
                <p className="cd-preview-title">{quickSetupPreview.filter(s=>s.willChange).length} matéria(s) serão alteradas:</p>
                {quickSetupPreview.filter(s=>s.willChange).map(s=>(
                  <div key={s.id} className="cd-preview-row">
                    <span className="cd-preview-name">{s.name}</span>
                    <span className={`cd-status-pill cd-s-${(s.status||'pendente').toLowerCase()}`}>{STATUS_LABELS[s.status]||'Pendente'}</span>
                    <span className="cd-preview-arrow">→</span>
                    <span className={`cd-status-pill cd-s-${s.newStatus.toLowerCase()}`}>{STATUS_LABELS[s.newStatus]}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="cd-modal-actions">
              <button className="cd-btn-cancel" onClick={()=>setQuickSetupOpen(false)} disabled={isSaving}>Cancelar</button>
              <button className="cd-btn-save" onClick={handleQuickSetup} disabled={isSaving||!quickSetupForm.currentPeriod}>
                {isSaving ? 'Aplicando…' : 'Aplicar Classificação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
