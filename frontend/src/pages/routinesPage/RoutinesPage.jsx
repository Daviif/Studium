import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { routinesApi, coursesApi, subjectsApi } from '../../services/api';
import './Routines.css';

const DAYS_OF_WEEK = [
  { value: 'SEGUNDA', label: 'Segunda-feira' },
  { value: 'TERCA', label: 'Terça-feira' },
  { value: 'QUARTA', label: 'Quarta-feira' },
  { value: 'QUINTA', label: 'Quinta-feira' },
  { value: 'SEXTA', label: 'Sexta-feira' },
  { value: 'SABADO', label: 'Sábado' },
  { value: 'DOMINGO', label: 'Domingo' }
];

export default function RoutinesPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [routines, setRoutines] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Estado do formulário
  const [formData, setFormData] = useState({
    dayOfWeek: 'SEGUNDA',
    startTime: '14:00',
    duration: 60,
    activity: '',
    professorSubjectId: ''
  });

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Carregar rotinas
      const routinesResponse = await routinesApi.getAllRoutines(token);
      const routinesList = Array.isArray(routinesResponse.data) ? routinesResponse.data : [];
      setRoutines(routinesList);

      // Carregar cursos
      const coursesResponse = await coursesApi.list(token);
      const coursesList = Array.isArray(coursesResponse.data) ? coursesResponse.data : [];
      setCourses(coursesList);

      // Carregar todos os professorSubjects de todos os cursos
      const allSubjects = [];
      const allProfessors = {};

      for (const course of coursesList) {
        try {
          const subjectsResponse = await subjectsApi.list(course.id, token);
          const courseSubjects = Array.isArray(subjectsResponse.data) ? subjectsResponse.data : [];
          
          for (const subject of courseSubjects) {
            if (subject.professorSubjects && Array.isArray(subject.professorSubjects)) {
              subject.professorSubjects.forEach(ps => {
                allSubjects.push({
                  ...ps,
                  subjectName: subject.name,
                  courseName: course.name
                });
                if (!allProfessors[ps.id]) {
                  allProfessors[ps.id] = ps;
                }
              });
            }
          }
        } catch (err) {
          console.warn('Erro ao carregar matérias do curso:', err);
        }
      }

      setSubjects(allSubjects);
      setProfessors(allProfessors);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Não foi possível carregar as rotinas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoutine = () => {
    setEditingId(null);
    setFormData({
      dayOfWeek: 'SEGUNDA',
      startTime: '14:00',
      duration: 60,
      activity: '',
      professorSubjectId: ''
    });
    setShowModal(true);
  };

  const handleEditRoutine = (routine) => {
    setEditingId(routine.id);
    setFormData({
      dayOfWeek: routine.dayOfWeek,
      startTime: routine.startTime,
      duration: routine.duration,
      activity: routine.activity,
      professorSubjectId: routine.professorSubjectId
    });
    setShowModal(true);
  };

  const handleDeleteRoutine = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta rotina?')) {
      try {
        await routinesApi.delete(id, token);
        setRoutines(routines.filter(r => r.id !== id));
      } catch (err) {
        console.error('Erro ao deletar rotina:', err);
        setError('Erro ao deletar rotina');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.activity.trim()) {
      setError('Atividade é obrigatória');
      return;
    }

    if (!formData.professorSubjectId) {
      setError('Selecione uma matéria/professor');
      return;
    }

    try {
      const submitData = {
        ...formData,
        duration: parseInt(formData.duration),
        professorSubjectId: parseInt(formData.professorSubjectId)
      };

      // Busca info da matéria/professor para enriquecer o estado local
      const subjectInfo = subjects.find(s => s.id === submitData.professorSubjectId);

      if (editingId) {
        const response = await routinesApi.update(editingId, submitData, token);
        const updatedRoutine = {
          ...response.data,
          subjectName: subjectInfo?.subjectName || '',
          professorName: subjectInfo?.professor?.name || ''
        };
        setRoutines(routines.map(r => r.id === editingId ? updatedRoutine : r));
      } else {
        const response = await routinesApi.create(submitData, token);
        const newRoutine = {
          ...response.data,
          subjectName: subjectInfo?.subjectName || '',
          professorName: subjectInfo?.professor?.name || ''
        };
        setRoutines([...routines, newRoutine]);
      }

      setShowModal(false);
      setFormData({
        dayOfWeek: 'SEGUNDA',
        startTime: '14:00',
        duration: 60,
        activity: '',
        professorSubjectId: ''
      });
    } catch (err) {
      console.error('Erro ao salvar rotina:', err);
      setError('Erro ao salvar rotina');
    }
  };

  const getDayLabel = (dayOfWeek) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || dayOfWeek;
  };

  const getSelectedSubjectInfo = (psId) => {
    return subjects.find(s => s.id === parseInt(psId));
  };

  const routinesByDay = {};
  DAYS_OF_WEEK.forEach(day => {
    routinesByDay[day.value] = routines.filter(r => r.dayOfWeek === day.value);
  });

  if (loading) {
    return (
      <div className="routines-container">
        <p>Carregando rotinas...</p>
      </div>
    );
  }

  return (
    <div className="routines-container">
      <div className="routines-header">
        <button className="back-button" onClick={() => navigate('/dashboard')} title="Voltar">
          <ArrowLeft size={20} />
        </button>

        <div className="routines-title">
          <h1>Minhas Rotinas</h1>
          <p>Organize seus horários de estudo</p>
        </div>

        <button className="add-routine-btn" onClick={handleAddRoutine}>
          <Plus size={20} />
          Nova Rotina
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="routines-content">
        {routines.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma rotina criada ainda</p>
            <p className="empty-text">Clique em "Nova Rotina" para começar a organizar seus horários de estudo</p>
          </div>
        ) : (
          <div className="routines-grid">
            {DAYS_OF_WEEK.map(day => (
              <div key={day.value} className="day-routines">
                <h3 className="day-name">{day.label}</h3>
                <div className="routines-list">
                  {routinesByDay[day.value].length === 0 ? (
                    <p className="no-routines">Sem rotinas</p>
                  ) : (
                    routinesByDay[day.value]
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(routine => {
                        const subjectInfo = getSelectedSubjectInfo(routine.professorSubjectId);
                        return (
                          <div key={routine.id} className="routine-card">
                            <div className="routine-time">
                              <p className="time">{routine.startTime}</p>
                              <p className="duration">({routine.duration}min)</p>
                            </div>
                            <div className="routine-details">
                              <p className="activity">{routine.activity}</p>
                              {subjectInfo && (
                                <>
                                  <p className="subject-name">{subjectInfo.subjectName}</p>
                                  <p className="professor-name">{subjectInfo.professor?.name}</p>
                                </>
                              )}
                            </div>
                            <div className="routine-actions">
                              <button
                                className="edit-btn"
                                onClick={() => handleEditRoutine(routine)}
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => handleDeleteRoutine(routine.id)}
                                title="Deletar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingId ? 'Editar Rotina' : 'Nova Rotina'}</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="dayOfWeek">Dia da Semana *</label>
                <select
                  id="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })}
                  required
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">Horário de Início *</label>
                  <input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="duration">Duração (minutos) *</label>
                  <input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="activity">Atividade *</label>
                <input
                  id="activity"
                  type="text"
                  placeholder="Ex: Revisar slides, Resolver exercícios"
                  value={formData.activity}
                  onChange={e => setFormData({ ...formData, activity: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="professorSubject">Matéria/Professor *</label>
                <select
                  id="professorSubject"
                  value={formData.professorSubjectId}
                  onChange={e => setFormData({ ...formData, professorSubjectId: e.target.value })}
                  required
                >
                  <option value="">Selecione uma matéria</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subjectName} - {subject.professor?.name || 'Sem professor'} ({subject.courseName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-buttons">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="save-btn">
                  {editingId ? 'Salvar Alterações' : 'Criar Rotina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
