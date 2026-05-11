import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle2, Circle, Calendar, Upload, Download, Trash2, Users, AlertCircle, Clock, CheckCheck, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subjectsApi, tasksApi, filesApi, routinesApi, evaluationsApi } from '../services/api';
import ProfessorsModal from '../components/ProfessorsModal';
import './SubjectsDetails.css';

// Função para calcular status da tarefa
const getTaskStatus = (dueDate, completed) => {
  if (completed) return { type: 'completed', label: 'Concluída', color: '#2ecc71' };
  
  if (!dueDate) return { type: 'no-date', label: 'Sem prazo', color: '#95a5a6' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { type: 'overdue', label: `${Math.abs(diffDays)} dia(s) atrasada`, color: '#e74c3c' };
  if (diffDays === 0) return { type: 'today', label: 'Entrega hoje!', color: '#f39c12' };
  if (diffDays === 1) return { type: 'tomorrow', label: 'Amanhã', color: '#f39c12' };
  if (diffDays <= 3) return { type: 'soon', label: 'Próxima', color: '#3498db' };
  
  return { type: 'normal', label: '', color: '#95a5a6' };
};

export default function SubjectDetailsPage() {
  const { courseId, subjectId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [subject, setSubject] = useState(null);
  const [selectedProfessorSubject, setSelectedProfessorSubject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [provas, setProvas] = useState([]);
  const [files, setFiles] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProvaModalOpen, setIsProvaModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProfessorsModalOpen, setIsProfessorsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProva, setSelectedProva] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    weight: 1.0,
    type: 'ATIVIDADE'
  });

  const [uploadData, setUploadData] = useState({
    file: null,
    customName: ''
  });

  useEffect(() => {
    loadSubjectDetails();
  }, [subjectId, token]);

  useEffect(() => {
    if (selectedProfessorSubject) {
      loadProfessorData();
    }
  }, [selectedProfessorSubject]);

  const loadSubjectDetails = async () => {
    try {
      setLoading(true);
      setError('');

      // Carrega detalhes da matéria com seus professores
      const subjectResponse = await subjectsApi.get(subjectId, token);
      setSubject(subjectResponse.data);

      // Seleciona o primeiro professor automaticamente
      if (subjectResponse.data.professorSubjects && subjectResponse.data.professorSubjects.length > 0) {
        setSelectedProfessorSubject(subjectResponse.data.professorSubjects[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar matéria:', err);
      setError('Não foi possível carregar os detalhes da matéria');
    } finally {
      setLoading(false);
    }
  };

  const loadProfessorData = async () => {
    if (!selectedProfessorSubject) return;

    try {
      setLoading(true);
      setError('');

      // Carrega tarefas do professor-matéria
      const tasksResponse = await tasksApi.listByProfessor(selectedProfessorSubject.id, token);
      setTasks(Array.isArray(tasksResponse.data) ? tasksResponse.data : []);

      // Carrega arquivos do professor-matéria
      const filesResponse = await filesApi.listByProfessor(selectedProfessorSubject.id, token);
      setFiles(Array.isArray(filesResponse.data) ? filesResponse.data : []);

      // Carrega rotinas do professor-matéria
      const routinesResponse = await routinesApi.listByProfessor(selectedProfessorSubject.id, token);
      setRoutines(Array.isArray(routinesResponse.data) ? routinesResponse.data : []);

      // Carrega provas da matéria
      const provasResponse = await evaluationsApi.list(subjectId, token);
      setProvas(Array.isArray(provasResponse.data) ? provasResponse.data : []);
    } catch (err) {
      console.error('Erro ao carregar dados do professor:', err);
      setError('Não foi possível carregar os dados deste professor');
      setTasks([]);
      setFiles([]);
      setRoutines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('O título da tarefa é obrigatório');
      return;
    }

    if (!selectedProfessorSubject) {
      setError('Selecione um professor primeiro');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      await tasksApi.create(
        {
          ...formData,
          professorSubjectId: selectedProfessorSubject.id
        },
        token
      );

      setFormData({ title: '', description: '', dueDate: '', weight: 1.0, type: 'ATIVIDADE' });
      setIsModalOpen(false);
      await loadProfessorData();
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
      setError('Erro ao criar tarefa. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      await tasksApi.complete(taskId, !currentStatus, token);
      await loadProfessorData();
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
      setError('Erro ao atualizar tarefa');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Deseja deletar esta tarefa?')) {
      try {
        await tasksApi.delete(taskId, token);
        await loadProfessorData();
      } catch (err) {
        console.error('Erro ao deletar tarefa:', err);
        setError('Erro ao deletar tarefa');
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de arquivo não permitido. Use: PDF, TXT, DOCX, JPG, JPEG ou PNG');
        return;
      }
      setUploadData({ ...uploadData, file });
      setError('');
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();

    if (!uploadData.file) {
      setError('Selecione um arquivo para enviar');
      return;
    }

    if (!selectedProfessorSubject) {
      setError('Selecione um professor primeiro');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const formDataToSend = new FormData();
      formDataToSend.append('file', uploadData.file);
      formDataToSend.append('professorSubjectId', selectedProfessorSubject.id);
      if (uploadData.customName.trim()) {
        formDataToSend.append('customName', uploadData.customName.trim());
      }

      await filesApi.upload(formDataToSend, token);

      setUploadData({ file: null, customName: '' });
      setIsUploadModalOpen(false);
      await loadProfessorData();
    } catch (err) {
      console.error('Erro ao enviar arquivo:', err);
      setError('Erro ao enviar arquivo. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm('Deseja deletar este arquivo?')) {
      try {
        await filesApi.delete(fileId, token);
        await loadProfessorData();
      } catch (err) {
        console.error('Erro ao deletar arquivo:', err);
        setError('Erro ao deletar arquivo');
      }
    }
  };

  if (loading) return <div className="subject-details-container"><p>Carregando...</p></div>;
  if (!subject) return <div className="subject-details-container"><p>Matéria não encontrada</p></div>;

  return (
    <div className="subject-details-container">
      <div className="subject-details-header">
        <button className="back-button" onClick={() => navigate(`/courses/${courseId}`)}>
          <ArrowLeft size={20} />
        </button>

        <div className="subject-info">
          <h1>{subject.name}</h1>
          <p>{subject.period ? `${subject.period}º Período` : 'Período não informado'}</p>
          {selectedProfessorSubject && (
            <>
              <p className="subject-professor">👨‍🏫 {selectedProfessorSubject.professor.name}</p>
              <p className="subject-semestre">📅 {selectedProfessorSubject.semestre}</p>
            </>
          )}
        </div>

        <button className="add-task-button" onClick={() => setIsProfessorsModalOpen(true)}>
          <Users size={18} />
          Professores
        </button>

        {selectedProfessorSubject && (
          <>
            <button className="add-task-button" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              Nova Tarefa
            </button>

            <button className="add-task-button" onClick={() => {
              setFormData({ title: '', description: '', dueDate: '', weight: 1.0, type: 'PROVA' });
              setIsProvaModalOpen(true);
            }}>
              <Zap size={18} />
              Nova Prova
            </button>

            <button className="add-task-button" onClick={() => setIsUploadModalOpen(true)}>
              <Upload size={18} />
              Upload
            </button>
          </>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {!selectedProfessorSubject ? (
        <div className="empty-state">
          <p>Nenhum professor associado a esta matéria. Clique em "Professores" para adicionar.</p>
        </div>
      ) : (
        <>
          <div className="tasks-section">
            <div className="tasks-header">
              <h2>Atividades e Tarefas</h2>
              <span className="tasks-count">{tasks.length}</span>
            </div>

            {tasks.length === 0 ? (
              <div className="empty-tasks">
                <CheckCheck size={48} color="#667eea" strokeWidth={1.5} />
                <p>Nenhuma tarefa para este professor.</p>
              </div>
            ) : (
              <div className="tasks-list">
                {tasks.map((task) => {
                  const status = getTaskStatus(task.dueDate, task.completed);
                  return (
                    <div key={task.id} className={`task-item task-${status.type}`}>
                      <button 
                        className="task-status-btn" 
                        onClick={() => handleToggleTask(task.id, task.completed)}
                        title={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                      >
                        {task.completed ? (
                          <CheckCircle2 size={24} color="#2ecc71" strokeWidth={2} />
                        ) : (
                          <Circle size={24} color="#e0e0e0" strokeWidth={2} />
                        )}
                      </button>
                      
                      <div className="task-content">
                        <div className="task-title-row">
                          <h3>{task.title}</h3>
                          {task.weight && task.weight > 1.0 && (
                            <span className="task-weight-badge">
                              Peso: {task.weight}
                            </span>
                          )}
                          {status.label && (
                            <span className="task-badge" style={{ borderColor: status.color, color: status.color }}>
                              {status.type === 'overdue' && <AlertCircle size={12} />}
                              {(status.type === 'today' || status.type === 'tomorrow' || status.type === 'soon') && <Clock size={12} />}
                              {status.label}
                            </span>
                          )}
                        </div>
                        {task.description && <p className="task-description">{task.description}</p>}
                        {task.dueDate && (
                          <span className="task-date">
                            <Calendar size={14} />
                            {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>

                      <button
                        className="task-delete-btn"
                        onClick={() => handleDeleteTask(task.id)}
                        title="Deletar tarefa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="provas-section">
            <div className="tasks-header">
              <h2>📝 Provas e Avaliações</h2>
              <span className="tasks-count">{provas.length}</span>
            </div>

            {provas.length === 0 ? (
              <div className="empty-tasks">
                <Zap size={48} color="#f39c12" strokeWidth={1.5} />
                <p>Nenhuma prova cadastrada para este professor.</p>
              </div>
            ) : (
              <div className="provas-list">
                {provas.map((prova) => {
                  const status = getTaskStatus(prova.dueDate, prova.completed);
                  return (
                    <div key={prova.id} className={`prova-item prova-${status.type}`}>
                      <div className="prova-header">
                        <h3>{prova.title}</h3>
                        <span className="prova-weight">Peso: {prova.weight}</span>
                      </div>
                      {prova.description && <p className="prova-description">{prova.description}</p>}
                      {prova.dueDate && (
                        <span className="prova-date">
                          <Calendar size={14} />
                          {new Date(prova.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {prova.evaluation && (
                        <div className="prova-evaluation">
                          <p className="evaluation-grade">
                            Nota: {prova.evaluation.grade}/{prova.evaluation.maxGrade}
                          </p>
                          <p className="evaluation-weight">
                            Peso: {prova.evaluation.weight}
                          </p>
                        </div>
                      )}
                      <div className="prova-actions">
                        {!prova.evaluation && (
                          <button
                            className="action-btn"
                            onClick={() => {
                              setSelectedProva(prova);
                              setIsEvaluationModalOpen(true);
                            }}
                            title="Adicionar nota"
                          >
                            ✏️ Nota
                          </button>
                        )}
                        {prova.evaluation && (
                          <button
                            className="action-btn"
                            onClick={() => {
                              setSelectedProva(prova);
                              setIsEvaluationModalOpen(true);
                            }}
                            title="Editar nota"
                          >
                            ✏️ Editar
                          </button>
                        )}
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteTask(prova.id)}
                          title="Deletar prova"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="files-section">
            <h2>Arquivos da Matéria</h2>

            {files.length === 0 ? (
              <div className="empty-files">
                <p>Nenhum arquivo enviado para este professor.</p>
              </div>
            ) : (
              <div className="files-list">
                {files.map((file) => (
                  <div key={file.id} className="file-item">
                    <div className="file-info">
                      <h3>{file.name}</h3>
                      <p className="file-meta">
                        {(file.size / 1024).toFixed(2)} KB • {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="file-actions">
                      <a 
                        href={file.url} 
                        download 
                        className="file-btn download-btn"
                        title="Baixar arquivo"
                      >
                        <Download size={18} />
                      </a>
                      <button
                        className="file-btn delete-btn"
                        onClick={() => handleDeleteFile(file.id)}
                        title="Deletar arquivo"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de Professores */}
      <ProfessorsModal
        subjectId={parseInt(subjectId)}
        isOpen={isProfessorsModalOpen}
        onClose={() => setIsProfessorsModalOpen(false)}
        token={token}
        onProfessorSelected={setSelectedProfessorSubject}
      />

      {/* Modal de Nova Prova */}
      {isProvaModalOpen && (
        <div className="modal-backdrop" onClick={() => !isSaving && setIsProvaModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nova Prova</h2>
            <p>Para {selectedProfessorSubject?.professor.name || 'este professor'}</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await handleCreateTask(e);
              setIsProvaModalOpen(false);
            }}>
              <label>Título</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Prova de Cálculo"
                disabled={isSaving}
              />

              <label>Peso da Prova</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 1.0 })}
                placeholder="Ex: 30.0"
                disabled={isSaving}
              />

              <label>Descrição (Opcional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Conteúdo cobrado, etc..."
                disabled={isSaving}
              />

              <label>Data da Prova</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                disabled={isSaving}
              />

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setIsProvaModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Criar Prova'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Avaliação/Nota */}
      {isEvaluationModalOpen && selectedProva && (
        <div className="modal-backdrop" onClick={() => !isSaving && setIsEvaluationModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedProva.evaluation ? 'Editar Nota' : 'Adicionar Nota'}</h2>
            <p>{selectedProva.title}</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                setIsSaving(true);
                const formElement = e.target;
                const grade = parseFloat(formElement.querySelector('input[name="grade"]').value);
                const maxGrade = parseFloat(formElement.querySelector('input[name="maxGrade"]').value);
                const weight = parseFloat(formElement.querySelector('input[name="weight"]').value);

                if (selectedProva.evaluation) {
                  await evaluationsApi.update(selectedProva.evaluation.id, { grade, maxGrade, weight }, token);
                } else {
                  await evaluationsApi.create({ taskId: selectedProva.id, grade, maxGrade, weight }, token);
                }

                setIsEvaluationModalOpen(false);
                setSelectedProva(null);
                await loadProfessorData();
              } catch (err) {
                console.error('Erro ao salvar avaliação:', err);
                setError('Erro ao salvar avaliação');
              } finally {
                setIsSaving(false);
              }
            }}>
              <label>Nota Obtida</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="grade"
                defaultValue={selectedProva.evaluation?.grade || ''}
                placeholder="Ex: 8.5"
                disabled={isSaving}
                required
              />

              <label>Nota Máxima</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="maxGrade"
                defaultValue={selectedProva.evaluation?.maxGrade || 10}
                placeholder="Ex: 10"
                disabled={isSaving}
                required
              />

              <label>Peso da Avaliação</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="weight"
                defaultValue={selectedProva.evaluation?.weight || selectedProva.weight || 1.0}
                placeholder="Ex: 30"
                disabled={isSaving}
                required
              />

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => {
                  setIsEvaluationModalOpen(false);
                  setSelectedProva(null);
                }}>
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar Nota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Upload */}
      {isUploadModalOpen && (
        <div className="modal-backdrop" onClick={() => !isSaving && setIsUploadModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Upload de Arquivo</h2>
            <p>Envie arquivos para {selectedProfessorSubject?.professor.name || 'este professor'}</p>
            <form onSubmit={handleUploadFile}>
              <label htmlFor="file-input">Arquivo (PDF, TXT, DOCX, JPG, JPEG, PNG)</label>
              <input
                id="file-input"
                type="file"
                accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={isSaving}
              />
              {uploadData.file && (
                <p className="file-selected">
                  ✓ {uploadData.file.name}
                </p>
              )}

              <label htmlFor="custom-name">Nome do Arquivo (Opcional)</label>
              <input
                id="custom-name"
                type="text"
                value={uploadData.customName}
                onChange={(e) => setUploadData({ ...uploadData, customName: e.target.value })}
                placeholder="Ex: prova do semestre"
                disabled={isSaving}
              />

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="secondary-button" 
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setUploadData({ file: null, customName: '' });
                  }}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={isSaving || !uploadData.file}>
                  {isSaving ? 'Enviando...' : 'Enviar Arquivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Criação de Tarefa */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => !isSaving && setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nova Tarefa</h2>
            <p>Para {selectedProfessorSubject?.professor.name || 'este professor'}</p>
            <form onSubmit={handleCreateTask}>
              <label>Título</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Estudar para prova"
                disabled={isSaving}
              />

              <label>Tipo de Tarefa</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                disabled={isSaving}
              >
                <option value="ATIVIDADE">Atividade</option>
                <option value="TRABALHO">Trabalho</option>
                
              </select>

              <label>Peso da Tarefa</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 1.0 })}
                placeholder="Ex: 1.0"
                disabled={isSaving}
              />

              <label>Descrição (Opcional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes da tarefa..."
                disabled={isSaving}
              />

              <label>Data de Entrega</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                disabled={isSaving}
              />

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}