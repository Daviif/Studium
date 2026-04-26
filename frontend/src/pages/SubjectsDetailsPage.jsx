import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle2, Circle, Calendar, Upload, Download, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subjectsApi, tasksApi, filesApi } from '../services/api';
import './SubjectsDetails.css';

export default function SubjectDetailsPage() {
  const { courseId, subjectId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [subject, setSubject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false);
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

  const [editSubjectData, setEditSubjectData] = useState({
    professor: '',
    semestre: ''
  });

  useEffect(() => {
    loadSubjectDetails();
  }, [subjectId, token]);

  const loadSubjectDetails = async () => {
    try {
      setLoading(true);
      setError('');

      // Carrega detalhes da matéria
      const subjectResponse = await subjectsApi.get(subjectId, token);
      setSubject(subjectResponse.data);

      // Carrega tarefas da matéria
      const tasksResponse = await tasksApi.list(subjectId, token);
      setTasks(tasksResponse.data || []);

      // Carrega arquivos da matéria
      const filesResponse = await filesApi.list(subjectId, token);
      setFiles(filesResponse.data || []);
    } catch (err) {
      console.error('Erro ao carregar matéria:', err);
      setError('Não foi possível carregar os detalhes da matéria');
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

    try {
      setIsSaving(true);
      setError('');

      await tasksApi.create(
        {
          ...formData,
          subjectId: parseInt(subjectId)
        },
        token
      );

      setFormData({ title: '', description: '', dueDate: '' });
      setIsModalOpen(false);
      await loadSubjectDetails();
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
      setError('Erro ao criar tarefa. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      // Atualizar status da tarefa
      await tasksApi.complete(taskId, !currentStatus, token);
      await loadSubjectDetails();
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
      setError('Erro ao atualizar tarefa');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
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

    try {
      setIsSaving(true);
      setError('');

      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('subjectId', parseInt(subjectId));
      if (uploadData.customName.trim()) {
        formData.append('customName', uploadData.customName.trim());
      }

      await filesApi.upload(formData, token);

      setUploadData({ file: null, customName: '' });
      setIsUploadModalOpen(false);
      await loadSubjectDetails();
    } catch (err) {
      console.error('Erro ao enviar arquivo:', err);
      setError('Erro ao enviar arquivo. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = () => {
    setEditSubjectData({
      professor: subject?.professor || '',
      semestre: subject?.semestre || ''
    });
    setIsEditSubjectModalOpen(true);
  };

  const handleUpdateSubject = async (e) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setError('');

      await subjectsApi.update(
        parseInt(subjectId),
        {
          professor: editSubjectData.professor || null,
          semestre: editSubjectData.semestre || null
        },
        token
      );

      setIsEditSubjectModalOpen(false);
      await loadSubjectDetails();
    } catch (err) {
      console.error('Erro ao atualizar matéria:', err);
      setError('Erro ao atualizar dados da matéria. Tente novamente.');
    } finally {
      setIsSaving(false);
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
          {subject.professor && <p className="subject-professor">👨‍🏫 {subject.professor}</p>}
          {subject.semestre && <p className="subject-semestre">📅 {subject.semestre}</p>}
        </div>

        <button className="add-task-button" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Nova Tarefa
        </button>

        <button className="add-task-button" onClick={() => setIsUploadModalOpen(true)}>
          <Upload size={18} />
          Upload de Arquivos
        </button>

        <button className="add-task-button" onClick={openEditModal}>
          <Plus size={18} />
          Editar Detalhes
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tasks-section">
        <h2>Atividades e Tarefas</h2>

        {tasks.length === 0 ? (
          <div className="empty-tasks">
            <p>Nenhuma tarefa para esta matéria.</p>
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
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="files-section">
        <h2>Arquivos da Matéria</h2>

        {files.length === 0 ? (
          <div className="empty-files">
            <p>Nenhum arquivo enviado para esta matéria.</p>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Upload */}
      {isUploadModalOpen && (
        <div className="modal-backdrop" onClick={() => !isSaving && setIsUploadModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Upload de Arquivo</h2>
            <p>Envie arquivos para esta matéria</p>
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
                placeholder="Ex: prova do semestre 2025/2"
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

      {/* Modal de Edição de Detalhes */}
      {isEditSubjectModalOpen && (
        <div className="modal-backdrop" onClick={() => !isSaving && setIsEditSubjectModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Editar Detalhes da Matéria</h2>
            <form onSubmit={handleUpdateSubject}>
              <label htmlFor="professor">Nome do Professor</label>
              <input
                id="professor"
                type="text"
                value={editSubjectData.professor}
                onChange={(e) => setEditSubjectData({ ...editSubjectData, professor: e.target.value })}
                placeholder="Ex: Dr. João Silva"
                disabled={isSaving}
              />

              <label htmlFor="semestre">Semestre Cursado</label>
              <input
                id="semestre"
                type="text"
                value={editSubjectData.semestre}
                onChange={(e) => setEditSubjectData({ ...editSubjectData, semestre: e.target.value })}
                placeholder="Ex: 2025/1"
                disabled={isSaving}
              />

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="secondary-button" 
                  onClick={() => setIsEditSubjectModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar'}
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