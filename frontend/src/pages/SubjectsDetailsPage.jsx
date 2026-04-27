import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle2, Circle, Calendar, Upload, Download, Trash2, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subjectsApi, tasksApi, filesApi, routinesApi } from '../services/api';
import ProfessorsModal from '../components/ProfessorsModal';
import './SubjectsDetails.css';

export default function SubjectDetailsPage() {
  const { courseId, subjectId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [subject, setSubject] = useState(null);
  const [selectedProfessorSubject, setSelectedProfessorSubject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProfessorsModalOpen, setIsProfessorsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: ''
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

      setFormData({ title: '', description: '', dueDate: '' });
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
            <h2>Atividades e Tarefas</h2>

            {tasks.length === 0 ? (
              <div className="empty-tasks">
                <p>Nenhuma tarefa para este professor.</p>
              </div>
            ) : (
              <div className="tasks-list">
                {tasks.map((task) => (
                  <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                    <button 
                      className="task-status-btn" 
                      onClick={() => handleToggleTask(task.id, task.completed)}
                    >
                      {task.completed ? <CheckCircle2 color="#2ecc71" /> : <Circle color="#95a5a6" />}
                    </button>
                    
                    <div className="task-content">
                      <h3>{task.title}</h3>
                      {task.description && <p>{task.description}</p>}
                      {task.dueDate && (
                        <span className="task-date">
                          <Calendar size={14} />
                          {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteTask(task.id)}
                      title="Deletar tarefa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
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
                      <h3>{file.originalName}</h3>
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