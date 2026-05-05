import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, CheckCircle2, Circle, ChevronLeft, ChevronRight, Zap, CheckSquare, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { coursesApi, subjectsApi, tasksApi, routinesApi } from '../services/api';
import './Schedule.css';

export default function SchedulePage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('week'); // 'week' ou 'month'
  const [taskFilters, setTaskFilters] = useState({
    ATIVIDADE: true,
    TRABALHO: true,
    PROVA: true,
    routines: true
  });

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Carregar cursos
      const coursesResponse = await coursesApi.list(token);
      const coursesData = Array.isArray(coursesResponse.data) ? coursesResponse.data : [];
      setCourses(coursesData);

      // Carregar todas as tarefas e rotinas de todas as matérias
      const allTasks = [];
      const allRoutines = [];

      for (const course of coursesData) {
        try {
          // Buscar matérias do curso
          const subjectsResponse = await subjectsApi.list(course.id, token);
          const subjects = Array.isArray(subjectsResponse.data) ? subjectsResponse.data : [];

          // Para cada matéria, buscar tarefas e rotinas de cada professor
          for (const subject of subjects) {
            if (subject.professorSubjects && Array.isArray(subject.professorSubjects)) {
              for (const professorSubject of subject.professorSubjects) {
                try {
                  // Carregar tarefas do professor-matéria
                  const tasksResponse = await tasksApi.listByProfessor(professorSubject.id, token);
                  if (Array.isArray(tasksResponse.data)) {
                    allTasks.push(...tasksResponse.data);
                  }

                  // Carregar rotinas do professor-matéria
                  const routinesResponse = await routinesApi.listByProfessor(professorSubject.id, token);
                  if (Array.isArray(routinesResponse.data)) {
                    allRoutines.push(...routinesResponse.data);
                  }
                } catch (err) {
                  console.error(`Erro ao carregar dados do professor-matéria ${professorSubject.id}:`, err);
                }
              }
            }
          }
        } catch (err) {
          console.error(`Erro ao carregar matérias do curso ${course.id}:`, err);
        }
      }

      setTasks(allTasks);
      setRoutines(allRoutines);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Não foi possível carregar o cronograma');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const getTaskIcon = (taskType) => {
    switch (taskType) {
      case 'ATIVIDADE':
        return <CheckSquare size={14} />;
      case 'TRABALHO':
        return <FileText size={14} />;
      case 'PROVA':
        return <Zap size={14} color="#f39c12" />;
      default:
        return <Circle size={14} />;
    }
  };

  const getTaskColor = (taskType) => {
    switch (taskType) {
      case 'ATIVIDADE':
        return '#667eea';
      case 'TRABALHO':
        return '#e67e22';
      case 'PROVA':
        return '#f39c12';
      default:
        return '#e74c3c';
    }
  };

  const getFilteredTasks = (date) => {
    const result = tasks.filter(task => {
      if (!task.dueDate) return false;
      
      // Comparar apenas a data (YYYY-MM-DD) sem considerar timezone
      const dueDatePart = task.dueDate.split('T')[0];
      const datePart = date.toISOString().split('T')[0];
      
      if (dueDatePart !== datePart) return false;
      
      // Aplicar filtros
      if (task.type === 'PROVA' && !taskFilters.PROVA) return false;
      if (task.type === 'ATIVIDADE' && !taskFilters.ATIVIDADE) return false;
      if (task.type === 'TRABALHO' && !taskFilters.TRABALHO) return false;
      
      return true;
    });
    
    return result;
  };

  const getTasksForDate = (date) => {
    return getFilteredTasks(date).filter(task => task.type !== 'PROVA');
  };

  const getProvasForDate = (date) => {
    return getFilteredTasks(date).filter(task => task.type === 'PROVA');
  };

  const getTaskCountByType = (date) => {
    const allTasks = getFilteredTasks(date);
    return {
      atividades: allTasks.filter(t => t.type === 'ATIVIDADE').length,
      trabalhos: allTasks.filter(t => t.type === 'TRABALHO').length,
      provas: allTasks.filter(t => t.type === 'PROVA').length
    };
  };

  const getRoutinesForDate = (date) => {
    if (!taskFilters.routines) return [];
    
    return routines.filter(routine => {
      if (!routine.dayOfWeek) return false;
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return dayNames[date.getDay()] === routine.dayOfWeek;
    });
  };

  const handleTaskToggle = async (taskId, currentStatus) => {
    try {
      await tasksApi.complete(taskId, !currentStatus, token);
      await loadData();
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
      setError('Erro ao atualizar tarefa');
    }
  };

  if (loading) {
    return (
      <div className="schedule-container">
        <p>Carregando cronograma...</p>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const weekStart = getWeekStart(currentDate);

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <button className="back-button" onClick={() => navigate('/')} title="Voltar">
          <ArrowLeft size={20} />
        </button>

        <div className="schedule-title">
          <h1>Cronograma</h1>
          <p>Gerencie suas tarefas e prazos</p>
        </div>

        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Semana
          </button>
          <button
            className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Mês
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="schedule-filters">
        <div className="filters-title">Filtrar por tipo:</div>
        <div className="filters-group">
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={taskFilters.ATIVIDADE}
              onChange={() => setTaskFilters({ ...taskFilters, ATIVIDADE: !taskFilters.ATIVIDADE })}
            />
            <CheckSquare size={16} color="#667eea" />
            <span>Atividades</span>
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={taskFilters.TRABALHO}
              onChange={() => setTaskFilters({ ...taskFilters, TRABALHO: !taskFilters.TRABALHO })}
            />
            <FileText size={16} color="#e67e22" />
            <span>Trabalhos</span>
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={taskFilters.PROVA}
              onChange={() => setTaskFilters({ ...taskFilters, PROVA: !taskFilters.PROVA })}
            />
            <Zap size={16} color="#f39c12" />
            <span>Provas</span>
          </label>
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={taskFilters.routines}
              onChange={() => setTaskFilters({ ...taskFilters, routines: !taskFilters.routines })}
            />
            <Clock size={16} color="#3498db" />
            <span>Rotinas</span>
          </label>
        </div>
      </div>

      <div className="calendar-controls">
        <button onClick={viewMode === 'week' ? previousWeek : previousMonth}>
          <ChevronLeft size={18} />
        </button>
        <span className="current-date">
          {viewMode === 'week'
            ? `${weekStart.toLocaleDateString('pt-BR')} - ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}`
            : currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          }
        </span>
        <button onClick={viewMode === 'week' ? nextWeek : nextMonth}>
          <ChevronRight size={18} />
        </button>
      </div>

      {viewMode === 'week' ? (
        <div className="week-view">
          {Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div key={i} className={`day-column ${isToday ? 'today' : ''}`}>
                <div className="day-header">
                  <div className="day-name">
                    {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </div>
                  <div className="day-date">{date.getDate()}</div>
                </div>

                <div className="day-content">
                  {getTasksForDate(date).length === 0 && getProvasForDate(date).length === 0 && getRoutinesForDate(date).length === 0 ? (
                    <div className="empty-day">
                      <p>Sem atividades</p>
                    </div>
                  ) : (
                    <>
                      {getRoutinesForDate(date).map((routine) => (
                        <div key={`routine-${routine.id}`} className="schedule-item routine-item">
                          <Clock size={14} />
                          <div className="item-content">
                            <p className="item-title">{routine.title}</p>
                            {routine.time && <span className="item-time">{routine.time}</span>}
                          </div>
                        </div>
                      ))}

                      {getProvasForDate(date).map((prova) => (
                        <div key={`prova-${prova.id}`} className={`schedule-item prova-item ${prova.completed ? 'completed' : ''}`}>
                          <Zap size={14} color="#f39c12" />
                          <div className="item-content">
                            <p className="item-title">{prova.title}</p>
                            {prova.weight && <span className="item-weight">Peso: {prova.weight}</span>}
                          </div>
                        </div>
                      ))}

                      {getTasksForDate(date).map((task) => (
                        <div 
                          key={`task-${task.id}`} 
                          className={`schedule-item task-item task-type-${task.type?.toLowerCase() || 'default'} ${task.completed ? 'completed' : ''}`}
                          onClick={() => handleTaskToggle(task.id, task.completed)}
                          role="button"
                          tabIndex={0}
                          title={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                        >
                          {task.completed ? (
                            <CheckCircle2 size={14} color="#2ecc71" />
                          ) : (
                            getTaskIcon(task.type)
                          )}
                          <div className="item-content">
                            <p className="item-title">{task.title}</p>
                            {task.weight && task.type === 'PROVA' && <span className="item-weight">Peso: {task.weight}</span>}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="month-view">
          <div className="calendar-grid">
            <div className="weekday-header">Dom</div>
            <div className="weekday-header">Seg</div>
            <div className="weekday-header">Ter</div>
            <div className="weekday-header">Qua</div>
            <div className="weekday-header">Qui</div>
            <div className="weekday-header">Sex</div>
            <div className="weekday-header">Sab</div>

            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="calendar-day empty"></div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
              const isToday = date.toDateString() === new Date().toDateString();
              const tasksByType = getTaskCountByType(date);
              const routinesCount = getRoutinesForDate(date).length;
              const totalEvents = tasksByType.atividades + tasksByType.trabalhos + tasksByType.provas + routinesCount;

              return (
                <div key={i} className={`calendar-day ${isToday ? 'today' : ''} ${totalEvents > 0 ? 'has-events' : ''}`}>
                  <div className="day-number">{i + 1}</div>
                  {totalEvents > 0 && (
                    <div className="event-indicators">
                      {routinesCount > 0 && <div className="indicator routine-indicator" title="Rotinas"></div>}
                      {tasksByType.provas > 0 && <div className="indicator prova-indicator" title="Provas"></div>}
                      {tasksByType.trabalhos > 0 && <div className="indicator trabalho-indicator" title="Trabalhos"></div>}
                      {tasksByType.atividades > 0 && <div className="indicator atividade-indicator" title="Atividades"></div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="schedule-legend">
        <div className="legend-item">
          <CheckSquare size={14} color="#667eea" />
          <span>Atividade</span>
        </div>
        <div className="legend-item">
          <FileText size={14} color="#e67e22" />
          <span>Trabalho</span>
        </div>
        <div className="legend-item">
          <Zap size={14} color="#f39c12" />
          <span>Prova</span>
        </div>
        <div className="legend-item">
          <Clock size={14} color="#3498db" />
          <span>Rotina/Horário</span>
        </div>
      </div>
    </div>
  );
}
