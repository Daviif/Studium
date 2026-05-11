import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, CheckCircle2, Circle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { coursesApi, tasksApi, routinesApi } from '../services/api';
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

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Carregar TODAS as tarefas do usuário (endpoint otimizado)
      const allTasksResponse = await tasksApi.getAllTasks(token);
      const allTasks = Array.isArray(allTasksResponse.data) ? allTasksResponse.data : [];

      // Enriquecer tarefas com informações de curso (nome da matéria já vem do backend)
      const enrichedTasks = allTasks.map(task => ({
        ...task,
        subjectName: task.subjectName || 'Sem matéria',
        professorName: task.professorName || 'Sem professor'
      }));

      setTasks(enrichedTasks);
      
      // Carregar TODAS as rotinas do usuário (endpoint otimizado)
      try {
        const allRoutinesResponse = await routinesApi.getAllRoutines(token);
        const allRoutines = Array.isArray(allRoutinesResponse.data) ? allRoutinesResponse.data : [];
        
        const enrichedRoutines = allRoutines.map(routine => ({
          ...routine,
          subjectName: routine.subjectName || 'Sem matéria',
          professorName: routine.professorName || 'Sem professor'
        }));
        
        setRoutines(enrichedRoutines);
      } catch (err) {
        console.warn('Erro ao carregar rotinas:', err);
        setRoutines([]);
      }
      
      // Carregar cursos (para possíveis filtros futuros)
      try {
        const coursesResponse = await coursesApi.list(token);
        const coursesList = Array.isArray(coursesResponse.data) ? coursesResponse.data : [];
        setCourses(coursesList);
      } catch (err) {
        console.warn('Erro ao carregar cursos:', err);
      }
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

  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate).toDateString();
      return taskDate === date.toDateString();
    });
  };

  const getRoutinesForDate = (date) => {
    return routines.filter(routine => {
      if (!routine.dayOfWeek) return false;
      // Mapa de dias da semana em JavaScript (0=Sunday) para português
      const dayNames = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
      return dayNames[date.getDay()] === routine.dayOfWeek;
    });
  };

  const getTaskTypeColor = (type) => {
    const colors = {
      'ATIVIDADE': '#3498db',
      'TRABALHO': '#f39c12',
      'PROVA': '#e74c3c'
    };
    return colors[type] || '#95a5a6';
  };

  const getTaskTypeLabel = (type) => {
    const labels = {
      'ATIVIDADE': 'Atividade',
      'TRABALHO': 'Trabalho',
      'PROVA': 'Prova'
    };
    return labels[type] || type;
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
                  {getTasksForDate(date).length === 0 && getRoutinesForDate(date).length === 0 ? (
                    <div className="empty-day">
                      <p>Sem atividades</p>
                    </div>
                  ) : (
                    <>
                      {getRoutinesForDate(date).map((routine) => (
                        <div key={`routine-${routine.id}`} className="schedule-item routine-item">
                          <Clock size={14} />
                          <div className="item-content">
                            <p className="item-title">{routine.activity}</p>
                            {routine.startTime && <span className="item-time">{routine.startTime} ({routine.duration}min)</span>}
                            {routine.subjectName && <span className="item-subject">{routine.subjectName}</span>}
                          </div>
                        </div>
                      ))}

                      {getTasksForDate(date).map((task) => (
                        <div 
                          key={`task-${task.id}`} 
                          className={`schedule-item task-item ${task.completed ? 'completed' : ''}`}
                          style={{ 
                            borderLeftColor: getTaskTypeColor(task.type),
                            borderLeftWidth: '3px',
                            paddingLeft: '10px'
                          }}
                        >
                          {task.completed ? (
                            <CheckCircle2 size={14} color="#2ecc71" />
                          ) : (
                            <Circle size={14} color={getTaskTypeColor(task.type)} />
                          )}
                          <div className="item-content">
                            <p className="item-title">{task.title}</p>
                            {task.subjectName && <span className="item-subject">{task.subjectName}</span>}
                            <span className="item-type" style={{ color: getTaskTypeColor(task.type), fontSize: '11px' }}>
                              {getTaskTypeLabel(task.type)}
                            </span>
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
              const tasksCount = getTasksForDate(date).length;
              const routinesCount = getRoutinesForDate(date).length;

              return (
                <div key={i} className={`calendar-day ${isToday ? 'today' : ''} ${tasksCount > 0 || routinesCount > 0 ? 'has-events' : ''}`}>
                  <div className="day-number">{i + 1}</div>
                  {(tasksCount > 0 || routinesCount > 0) && (
                    <div className="event-indicators">
                      {routinesCount > 0 && <div className="indicator routine-indicator" title="Rotinas"></div>}
                      {tasksCount > 0 && <div className="indicator task-indicator" title="Tarefas"></div>}
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
          <Circle size={14} color="#3498db" />
          <span>Atividade</span>
        </div>
        <div className="legend-item">
          <Circle size={14} color="#f39c12" />
          <span>Trabalho</span>
        </div>
        <div className="legend-item">
          <Circle size={14} color="#e74c3c" />
          <span>Prova</span>
        </div>
        <div className="legend-item">
          <CheckCircle2 size={14} color="#2ecc71" />
          <span>Concluído</span>
        </div>
        <div className="legend-item">
          <Clock size={14} color="#3498db" />
          <span>Rotina/Horário</span>
        </div>
      </div>
    </div>
  );
}
