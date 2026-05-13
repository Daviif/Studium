import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, CheckCircle2, Circle, Calendar,
  Upload, Download, Trash2, Users, Zap, Edit2,
  FileText, BookOpen, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { subjectsApi, tasksApi, filesApi, routinesApi, evaluationsApi } from '../../services/api';
import ProfessorsModal from '../../components/ProfessorsModal';
import './SubjectsDetails.css';

const MONTHS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function taskStatus(dueDate, completed) {
  if (completed) return { cls: 'sd-completed', label: 'Concluída' };
  if (!dueDate)  return { cls: '', label: '' };
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(dueDate); due.setHours(0,0,0,0);
  const d = Math.ceil((due - today) / 86400000);
  if (d < 0)  return { cls: 'sd-overdue',  label: `${Math.abs(d)}d atrasada` };
  if (d === 0) return { cls: 'sd-today',   label: 'Hoje!' };
  if (d === 1) return { cls: 'sd-tomorrow',label: 'Amanhã' };
  if (d <= 3)  return { cls: 'sd-soon',    label: `em ${d}d` };
  return { cls: '', label: '' };
}

function fmtDate(iso) {
  const d = new Date(iso);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}.`;
}

const TYPE_STYLE = {
  TRABALHO:  { label: 'Trabalho',  bg: '#fef3c7', color: '#92400e' },
  ATIVIDADE: { label: 'Atividade', bg: '#d1fae5', color: '#065f46' },
  PROVA:     { label: 'Prova',     bg: '#fee2e2', color: '#991b1b' },
};

export default function SubjectDetailsPage() {
  const { courseId, subjectId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [subject,   setSubject]   = useState(null);
  const [selPS,     setSelPS]     = useState(null); // selected professorSubject
  const [tasks,     setTasks]     = useState([]);
  const [provas,    setProvas]    = useState([]);
  const [files,     setFiles]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [isSaving,  setIsSaving]  = useState(false);

  // Modals
  const [profModal,  setProfModal]  = useState(false);
  const [taskModal,  setTaskModal]  = useState(false);
  const [provaModal, setProvaModal] = useState(false);
  const [evalModal,  setEvalModal]  = useState(false);
  const [uploadModal,setUploadModal]= useState(false);
  const [selProva,   setSelProva]   = useState(null);
  const [editTaskId, setEditTaskId] = useState(null);

  const [taskForm, setTaskForm] = useState({ title:'', description:'', dueDate:'', weight:1.0, type:'ATIVIDADE' });
  const [provaForm,setProvaForm] = useState({ title:'', description:'', dueDate:'', weight:1.0, type:'PROVA' });
  const [uploadData,setUploadData]= useState({ file:null, customName:'' });

  useEffect(() => { loadSubject(); }, [subjectId, token]);
  useEffect(() => { if (selPS) loadData(); }, [selPS]);

  async function loadSubject() {
    try {
      setLoading(true); setError('');
      const res = await subjectsApi.get(subjectId, token);
      setSubject(res.data);
      if (res.data.professorSubjects?.length > 0) setSelPS(res.data.professorSubjects[0]);
    } catch { setError('Não foi possível carregar a matéria.'); }
    finally { setLoading(false); }
  }

  async function loadData() {
    if (!selPS) return;
    try {
      setLoading(true); setError('');
      const [tR, fR, pR] = await Promise.all([
        tasksApi.listByProfessor(selPS.id, token),
        filesApi.listByProfessor(selPS.id, token),
        evaluationsApi.list(subjectId, token),
      ]);
      setTasks(Array.isArray(tR.data) ? tR.data : []);
      setFiles(Array.isArray(fR.data) ? fR.data : []);
      setProvas(Array.isArray(pR.data) ? pR.data : []);
    } catch { setError('Erro ao carregar dados.'); setTasks([]); setFiles([]); setProvas([]); }
    finally { setLoading(false); }
  }

  // Tasks
  async function handleSaveTask(e) {
    e.preventDefault();
    if (!taskForm.title.trim()) { setError('Título é obrigatório.'); return; }
    try {
      setIsSaving(true); setError('');
      if (editTaskId) {
        await tasksApi.update(editTaskId, { title:taskForm.title, description:taskForm.description, dueDate:taskForm.dueDate||null, weight:taskForm.weight, type:taskForm.type }, token);
      } else {
        await tasksApi.create({ ...taskForm, professorSubjectId: selPS.id }, token);
      }
      setTaskModal(false); setEditTaskId(null);
      setTaskForm({ title:'', description:'', dueDate:'', weight:1.0, type:'ATIVIDADE' });
      await loadData();
    } catch { setError('Erro ao salvar tarefa.'); }
    finally { setIsSaving(false); }
  }

  function openEditTask(task) {
    setEditTaskId(task.id);
    setTaskForm({ title:task.title, description:task.description||'', dueDate:task.dueDate?task.dueDate.split('T')[0]:'', weight:task.weight??1.0, type:task.type||'ATIVIDADE' });
    setTaskModal(true);
  }

  async function toggleTask(id, completed) {
    try { await tasksApi.complete(id, !completed, token); await loadData(); }
    catch { setError('Erro ao atualizar tarefa.'); }
  }

  async function deleteTask(id) {
    if (!confirm('Deletar esta tarefa?')) return;
    try { await tasksApi.delete(id, token); await loadData(); }
    catch { setError('Erro ao deletar.'); }
  }

  // Provas
  async function handleSaveProva(e) {
    e.preventDefault();
    if (!provaForm.title.trim()) { setError('Título é obrigatório.'); return; }
    try {
      setIsSaving(true); setError('');
      await tasksApi.create({ ...provaForm, type:'PROVA', professorSubjectId: selPS.id }, token);
      setProvaModal(false);
      setProvaForm({ title:'', description:'', dueDate:'', weight:1.0, type:'PROVA' });
      await loadData();
    } catch { setError('Erro ao criar prova.'); }
    finally { setIsSaving(false); }
  }

  async function handleSaveGrade(e) {
    e.preventDefault();
    try {
      setIsSaving(true); setError('');
      const form = e.target;
      const grade    = parseFloat(form.querySelector('[name="grade"]').value);
      const maxGrade = parseFloat(form.querySelector('[name="maxGrade"]').value);
      const weight   = parseFloat(form.querySelector('[name="weight"]').value);
      if (selProva.evaluation) {
        await evaluationsApi.update(selProva.evaluation.id, { grade, maxGrade, weight }, token);
      } else {
        await evaluationsApi.create({ taskId: selProva.id, grade, maxGrade, weight }, token);
      }
      setEvalModal(false); setSelProva(null);
      await loadData();
    } catch { setError('Erro ao salvar nota.'); }
    finally { setIsSaving(false); }
  }

  // Files
  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadData.file) { setError('Selecione um arquivo.'); return; }
    try {
      setIsSaving(true); setError('');
      const fd = new FormData();
      fd.append('file', uploadData.file);
      fd.append('professorSubjectId', selPS.id);
      if (uploadData.customName.trim()) fd.append('customName', uploadData.customName.trim());
      await filesApi.upload(fd, token);
      setUploadModal(false); setUploadData({ file:null, customName:'' });
      await loadData();
    } catch { setError('Erro ao enviar arquivo.'); }
    finally { setIsSaving(false); }
  }

  async function deleteFile(id) {
    if (!confirm('Deletar este arquivo?')) return;
    try { await filesApi.delete(id, token); await loadData(); }
    catch { setError('Erro ao deletar arquivo.'); }
  }

  // ── Render ─────────────────────────────────────────────
  if (loading && !subject) return <div className="sd-page"><div className="sd-loading">Carregando…</div></div>;
  if (!subject) return <div className="sd-page"><p style={{padding:32,color:'#6b7280'}}>Matéria não encontrada.</p></div>;

  const activeTasks = tasks.filter(t => t.type !== 'PROVA');
  const doneTasks   = activeTasks.filter(t => t.completed).length;

  return (
    <div className="sd-page">
      <div className="sd-inner">

        {/* ── Header ── */}
        <div className="sd-header">
          <button className="sd-back" onClick={() => navigate(`/courses/${courseId}`)} title="Voltar">
            <ArrowLeft size={17}/>
          </button>
          <div className="sd-subject-info">
            <h1 className="sd-subject-name">{subject.name}</h1>
            <div className="sd-subject-meta">
              {subject.period && <span>{subject.period}º Período</span>}
              {subject.type && <span className="sd-type-badge">{subject.type === 'OBRIGATORIA' ? 'Obrigatória' : subject.type}</span>}
              {selPS && <span>Prof. {selPS.professor.name} · {selPS.semestre}</span>}
            </div>
          </div>
          <div className="sd-actions">
            <button className="sd-action-outline" onClick={() => setProfModal(true)}>
              <Users size={14}/><span>Professores</span>
            </button>
            {selPS && <>
              <button className="sd-action-outline" onClick={() => setUploadModal(true)}>
                <Upload size={14}/><span>Upload</span>
              </button>
              <button className="sd-action-outline sd-prova-btn" onClick={() => { setProvaForm({ title:'', description:'', dueDate:'', weight:1.0, type:'PROVA' }); setProvaModal(true); }}>
                <Zap size={14}/><span>Nova Prova</span>
              </button>
              <button className="sd-action-primary" onClick={() => { setEditTaskId(null); setTaskForm({ title:'', description:'', dueDate:'', weight:1.0, type:'ATIVIDADE' }); setTaskModal(true); }}>
                <Plus size={14}/> Nova Tarefa
              </button>
            </>}
          </div>
        </div>

        {/* Professor selector — múltiplos */}
        {subject.professorSubjects?.length > 1 && (
          <div className="sd-prof-tabs">
            {subject.professorSubjects.map(ps => (
              <button
                key={ps.id}
                className={`sd-prof-tab ${selPS?.id === ps.id ? 'active' : ''}`}
                onClick={() => setSelPS(ps)}
              >
                {ps.professor.name} <span>{ps.semestre}</span>
              </button>
            ))}
          </div>
        )}

        {error && <div className="sd-error">{error}</div>}

        {!selPS ? (
          <div className="sd-empty-card">
            <Users size={36}/>
            <p>Nenhum professor associado.</p>
            <button className="sd-action-primary" onClick={() => setProfModal(true)}>
              <Users size={14}/> Adicionar Professor
            </button>
          </div>
        ) : (
          <div className="sd-content">

            {/* ── Tarefas ── */}
            <section className="sd-section">
              <div className="sd-section-hdr">
                <div className="sd-section-title">
                  <h2>Tarefas</h2>
                  <span className="sd-count">{activeTasks.length}</span>
                </div>
                <span className="sd-progress-txt">{doneTasks}/{activeTasks.length} concluídas</span>
              </div>

              {/* Progress bar */}
              {activeTasks.length > 0 && (
                <div className="sd-progress-bar">
                  <div className="sd-progress-fill" style={{ width: `${activeTasks.length > 0 ? (doneTasks/activeTasks.length)*100 : 0}%` }}/>
                </div>
              )}

              {activeTasks.length === 0 ? (
                <div className="sd-empty-inline">
                  <BookOpen size={28}/>
                  <p>Nenhuma tarefa ainda.</p>
                </div>
              ) : (
                <div className="sd-task-list">
                  {activeTasks.map(task => {
                    const st  = taskStatus(task.dueDate, task.completed);
                    const ts  = TYPE_STYLE[task.type] || TYPE_STYLE.ATIVIDADE;
                    return (
                      <div key={task.id} className={`sd-task ${task.completed ? 'sd-task-done' : ''}`}>
                        <button className="sd-check" onClick={() => toggleTask(task.id, task.completed)} title="Marcar como concluída">
                          {task.completed
                            ? <CheckCircle2 size={20} strokeWidth={2}/>
                            : <Circle size={20} strokeWidth={2}/>
                          }
                        </button>
                        <div className="sd-task-body">
                          <div className="sd-task-row">
                            <span className="sd-task-title">{task.title}</span>
                            <span className="sd-type-chip" style={{background:ts.bg, color:ts.color}}>{ts.label}</span>
                            {task.weight > 1 && <span className="sd-weight-chip">Peso {task.weight}</span>}
                            {st.label && <span className={`sd-deadline ${st.cls}`}>{st.label}</span>}
                          </div>
                          {task.description && <p className="sd-task-desc">{task.description}</p>}
                          {task.dueDate && (
                            <span className="sd-task-date">
                              <Calendar size={12}/> {fmtDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                        <div className="sd-task-btns">
                          <button className="sd-icon-btn" onClick={() => openEditTask(task)} title="Editar"><Edit2 size={13}/></button>
                          <button className="sd-icon-btn sd-icon-del" onClick={() => deleteTask(task.id)} title="Deletar"><Trash2 size={13}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── Provas ── */}
            <section className="sd-section">
              <div className="sd-section-hdr">
                <div className="sd-section-title">
                  <h2>Provas</h2>
                  <span className="sd-count">{provas.length}</span>
                </div>
              </div>

              {provas.length === 0 ? (
                <div className="sd-empty-inline">
                  <Zap size={28}/>
                  <p>Nenhuma prova cadastrada.</p>
                </div>
              ) : (
                <div className="sd-provas-grid">
                  {provas.map(prova => {
                    const st = taskStatus(prova.dueDate, prova.completed);
                    const hasGrade = !!prova.evaluation;
                    const pct = hasGrade ? Math.round((prova.evaluation.grade / prova.evaluation.maxGrade) * 100) : null;
                    return (
                      <div key={prova.id} className="sd-prova-card">
                        <div className="sd-prova-top">
                          <h3 className="sd-prova-title">{prova.title}</h3>
                          <div className="sd-prova-btns">
                            <button
                              className="sd-icon-btn"
                              onClick={() => { setSelProva(prova); setEvalModal(true); }}
                              title={hasGrade ? 'Editar nota' : 'Adicionar nota'}
                            >
                              <Edit2 size={13}/>
                            </button>
                            <button className="sd-icon-btn sd-icon-del" onClick={() => deleteTask(prova.id)} title="Deletar">
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </div>

                        {prova.description && <p className="sd-prova-desc">{prova.description}</p>}

                        <div className="sd-prova-meta">
                          {prova.dueDate && <span><Calendar size={12}/> {fmtDate(prova.dueDate)}</span>}
                          <span className="sd-weight-chip">Peso {prova.weight}</span>
                          {st.label && <span className={`sd-deadline ${st.cls}`}>{st.label}</span>}
                        </div>

                        {hasGrade ? (
                          <div className="sd-grade">
                            <div className="sd-grade-bar-track">
                              <div className="sd-grade-bar-fill" style={{
                                width: `${pct}%`,
                                background: pct >= 60 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'
                              }}/>
                            </div>
                            <span className="sd-grade-label" style={{color: pct >= 60 ? '#15803d' : pct >= 40 ? '#92400e' : '#991b1b'}}>
                              {prova.evaluation.grade}/{prova.evaluation.maxGrade}
                            </span>
                          </div>
                        ) : (
                          <button className="sd-add-grade-btn" onClick={() => { setSelProva(prova); setEvalModal(true); }}>
                            + Adicionar nota
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── Arquivos ── */}
            <section className="sd-section">
              <div className="sd-section-hdr">
                <div className="sd-section-title">
                  <h2>Arquivos</h2>
                  <span className="sd-count">{files.length}</span>
                </div>
              </div>

              {files.length === 0 ? (
                <div className="sd-empty-inline">
                  <FileText size={28}/>
                  <p>Nenhum arquivo enviado.</p>
                </div>
              ) : (
                <div className="sd-files-list">
                  {files.map(file => (
                    <div key={file.id} className="sd-file-row">
                      <FileText size={18} className="sd-file-icon"/>
                      <div className="sd-file-info">
                        <span className="sd-file-name">{file.name}</span>
                        <span className="sd-file-meta">{(file.size/1024).toFixed(1)} KB · {fmtDate(file.uploadedAt)}</span>
                      </div>
                      <div className="sd-file-btns">
                        <a href={file.url} download className="sd-icon-btn sd-icon-dl" title="Baixar">
                          <Download size={13}/>
                        </a>
                        <button className="sd-icon-btn sd-icon-del" onClick={() => deleteFile(file.id)} title="Deletar">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        )}
      </div>

      {/* ── Modal: Professores ── */}
      <ProfessorsModal
        subjectId={parseInt(subjectId)} isOpen={profModal}
        onClose={() => setProfModal(false)} token={token}
        onProfessorSelected={ps => { setSelPS(ps); loadSubject(); }}
      />

      {/* ── Modal: Nova/Editar Tarefa ── */}
      {taskModal && (
        <div className="sd-overlay" onClick={() => !isSaving && (setTaskModal(false), setEditTaskId(null))}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <div className="sd-modal-hdr">
              <h2>{editTaskId ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <button className="sd-modal-close" onClick={() => { setTaskModal(false); setEditTaskId(null); }}><X size={16}/></button>
            </div>
            <p className="sd-modal-sub">Prof. {selPS?.professor.name}</p>
            <form onSubmit={handleSaveTask}>
              <div className="sd-field"><label>TÍTULO</label>
                <input value={taskForm.title} onChange={e=>setTaskForm(p=>({...p,title:e.target.value}))} placeholder="Ex: Lista 3" disabled={isSaving}/>
              </div>
              <div className="sd-field-row">
                <div className="sd-field"><label>TIPO</label>
                  <select value={taskForm.type} onChange={e=>setTaskForm(p=>({...p,type:e.target.value}))} disabled={isSaving}>
                    <option value="ATIVIDADE">Atividade</option>
                    <option value="TRABALHO">Trabalho</option>
                  </select>
                </div>
                <div className="sd-field"><label>PESO</label>
                  <input type="number" step="0.1" min="0" value={taskForm.weight} onChange={e=>setTaskForm(p=>({...p,weight:parseFloat(e.target.value)||1}))} disabled={isSaving}/>
                </div>
                <div className="sd-field"><label>ENTREGA</label>
                  <input type="date" value={taskForm.dueDate} onChange={e=>setTaskForm(p=>({...p,dueDate:e.target.value}))} disabled={isSaving}/>
                </div>
              </div>
              <div className="sd-field"><label>DESCRIÇÃO (opcional)</label>
                <textarea value={taskForm.description} onChange={e=>setTaskForm(p=>({...p,description:e.target.value}))} placeholder="Detalhes da tarefa…" disabled={isSaving}/>
              </div>
              <div className="sd-modal-actions">
                <button type="button" className="sd-btn-cancel" onClick={() => { setTaskModal(false); setEditTaskId(null); }}>Cancelar</button>
                <button type="submit" className="sd-btn-save" disabled={isSaving}>{isSaving ? 'Salvando…' : editTaskId ? 'Salvar' : 'Criar Tarefa'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Nova Prova ── */}
      {provaModal && (
        <div className="sd-overlay" onClick={() => !isSaving && setProvaModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <div className="sd-modal-hdr">
              <h2>Nova Prova</h2>
              <button className="sd-modal-close" onClick={() => setProvaModal(false)}><X size={16}/></button>
            </div>
            <p className="sd-modal-sub">Prof. {selPS?.professor.name}</p>
            <form onSubmit={handleSaveProva}>
              <div className="sd-field"><label>TÍTULO</label>
                <input value={provaForm.title} onChange={e=>setProvaForm(p=>({...p,title:e.target.value}))} placeholder="Ex: Prova 1 — Cálculo" disabled={isSaving}/>
              </div>
              <div className="sd-field-row">
                <div className="sd-field"><label>PESO</label>
                  <input type="number" step="0.1" min="0" value={provaForm.weight} onChange={e=>setProvaForm(p=>({...p,weight:parseFloat(e.target.value)||1}))} disabled={isSaving}/>
                </div>
                <div className="sd-field"><label>DATA</label>
                  <input type="date" value={provaForm.dueDate} onChange={e=>setProvaForm(p=>({...p,dueDate:e.target.value}))} disabled={isSaving}/>
                </div>
              </div>
              <div className="sd-field"><label>CONTEÚDO (opcional)</label>
                <textarea value={provaForm.description} onChange={e=>setProvaForm(p=>({...p,description:e.target.value}))} placeholder="Conteúdo cobrado…" disabled={isSaving}/>
              </div>
              <div className="sd-modal-actions">
                <button type="button" className="sd-btn-cancel" onClick={() => setProvaModal(false)}>Cancelar</button>
                <button type="submit" className="sd-btn-save" disabled={isSaving}>{isSaving ? 'Salvando…' : 'Criar Prova'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Nota ── */}
      {evalModal && selProva && (
        <div className="sd-overlay" onClick={() => !isSaving && (setEvalModal(false), setSelProva(null))}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <div className="sd-modal-hdr">
              <h2>{selProva.evaluation ? 'Editar Nota' : 'Adicionar Nota'}</h2>
              <button className="sd-modal-close" onClick={() => { setEvalModal(false); setSelProva(null); }}><X size={16}/></button>
            </div>
            <p className="sd-modal-sub">{selProva.title}</p>
            <form onSubmit={handleSaveGrade}>
              <div className="sd-field-row">
                <div className="sd-field"><label>NOTA OBTIDA</label>
                  <input type="number" step="0.1" min="0" name="grade" defaultValue={selProva.evaluation?.grade || ''} placeholder="Ex: 8.5" required disabled={isSaving}/>
                </div>
                <div className="sd-field"><label>NOTA MÁXIMA</label>
                  <input type="number" step="0.1" min="0" name="maxGrade" defaultValue={selProva.evaluation?.maxGrade || 10} placeholder="Ex: 10" required disabled={isSaving}/>
                </div>
                <div className="sd-field"><label>PESO</label>
                  <input type="number" step="0.1" min="0" name="weight" defaultValue={selProva.evaluation?.weight || selProva.weight || 1} placeholder="Ex: 1" required disabled={isSaving}/>
                </div>
              </div>
              <div className="sd-modal-actions">
                <button type="button" className="sd-btn-cancel" onClick={() => { setEvalModal(false); setSelProva(null); }}>Cancelar</button>
                <button type="submit" className="sd-btn-save" disabled={isSaving}>{isSaving ? 'Salvando…' : 'Salvar Nota'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Upload ── */}
      {uploadModal && (
        <div className="sd-overlay" onClick={() => !isSaving && setUploadModal(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <div className="sd-modal-hdr">
              <h2>Upload de Arquivo</h2>
              <button className="sd-modal-close" onClick={() => setUploadModal(false)}><X size={16}/></button>
            </div>
            <p className="sd-modal-sub">PDF, TXT, DOCX, JPG, PNG · máx. 10 MB</p>
            <form onSubmit={handleUpload}>
              <div className="sd-field">
                <label>ARQUIVO</label>
                <div className="sd-file-drop" onClick={() => document.getElementById('sd-file-input').click()}>
                  <Upload size={22}/>
                  <span>{uploadData.file ? uploadData.file.name : 'Clique ou arraste o arquivo aqui'}</span>
                  <input id="sd-file-input" type="file" accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png"
                    style={{display:'none'}}
                    onChange={e => { const f=e.target.files?.[0]; if(f) setUploadData(p=>({...p,file:f})); }}
                    disabled={isSaving}
                  />
                </div>
              </div>
              <div className="sd-field"><label>NOME PERSONALIZADO (opcional)</label>
                <input value={uploadData.customName} onChange={e=>setUploadData(p=>({...p,customName:e.target.value}))} placeholder="Ex: Resumo P1" disabled={isSaving}/>
              </div>
              <div className="sd-modal-actions">
                <button type="button" className="sd-btn-cancel" onClick={() => setUploadModal(false)}>Cancelar</button>
                <button type="submit" className="sd-btn-save" disabled={isSaving || !uploadData.file}>{isSaving ? 'Enviando…' : 'Enviar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
