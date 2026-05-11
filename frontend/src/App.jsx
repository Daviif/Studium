import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, BookOpen, ChevronRight } from 'lucide-react';
import { coursesApi, subjectsApi, tasksApi } from './services/api';
import { useAuth } from './contexts/AuthContext';
import QuickShortcuts from './components/QuickShortcuts';
import './App.css';

function App() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  useEffect(() => {
    loadDashboardData();
  }, [token]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // Carregar cursos para obter matérias
      const coursesResponse = await coursesApi.list(token);
      const coursesData = Array.isArray(coursesResponse.data) ? coursesResponse.data : [];

      const allSubjects = [];
      const allTasks = [];

      // Carregar matérias e tarefas
      for (const course of coursesData) {
        try {
          const subjectsResponse = await subjectsApi.list(course.id, token);
          const courseSubjects = Array.isArray(subjectsResponse.data) ? subjectsResponse.data : [];
          
          for (const subject of courseSubjects) {
            allSubjects.push({ ...subject, courseName: course.name });

            // Carregar tarefas de cada professor da matéria
            if (subject.professorSubjects && Array.isArray(subject.professorSubjects)) {
              for (const professorSubject of subject.professorSubjects) {
                try {
                  const tasksResponse = await tasksApi.listByProfessor(professorSubject.id, token);
                  if (Array.isArray(tasksResponse.data)) {
                    const tasksWithMetadata = tasksResponse.data.map(task => ({
                      ...task,
                      subjectName: subject.name,
                      professorName: professorSubject.professor?.name,
                      professorSubjectId: professorSubject.id,
                      courseId: course.id,
                      subjectId: subject.id
                    }));
                    allTasks.push(...tasksWithMetadata);
                  }
                } catch (err) {
                  console.error(`Erro ao carregar tarefas:`, err);
                }
              }
            }
          }
        } catch (err) {
          console.error(`Erro ao carregar matérias do curso:`, err);
        }
      }

      // Ordenar matérias por atualização recente (últimas 5)
      const recentSubjects = allSubjects
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 5);

      // Filtrar tarefas não concluídas com data próxima
      const today = new Date();
      const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      const upcomingTasksList = allTasks
        .filter(task => {
          if (!task.dueDate || task.completed) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate <= next30Days;
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 8); // Top 8 atividades próximas

      setSubjects(recentSubjects);
      setUpcomingTasks(upcomingTasksList);
    } catch (error) {
      setErrorMessage('Não foi possível carregar os dados.');
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskIcon = (taskType) => {
    switch (taskType) {
      case 'PROVA':
        return '⚡';
      case 'TRABALHO':
        return '📝';
      case 'ATIVIDADE':
      default:
        return '✓';
    }
  };

  const getDaysUntil = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = due.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="app-content">
      <div className="app-header">
        <div>
          <h1>Visão Geral</h1>
          <p>Bem-vindo, {user?.name?.split(' ')[0]}</p>
        </div>
      </div>

      <QuickShortcuts />

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="loading">Carregando dados...</div>
      ) : (
        <>
          {/* Atividades Próximas */}
          {upcomingTasks.length > 0 && (
            <section className="dashboard-section">
              <div className="section-header">
                <div className="section-title">
                  <AlertCircle size={20} />
                  <h2>Atividades Próximas de Expirar</h2>
                </div>
                <button 
                  className="view-all-btn"
                  onClick={() => navigate('/schedule')}
                  title="Ver cronograma completo"
                >
                  Ver Cronograma <ChevronRight size={16} />
                </button>
              </div>

              <div className="upcoming-tasks">
                {upcomingTasks.map((task) => {
                  const daysUntil = getDaysUntil(task.dueDate);
                  const isUrgent = daysUntil <= 3;
                  const isSoon = daysUntil <= 7;

                  return (
                    <div 
                      key={task.id}
                      className={`task-card ${isUrgent ? 'urgent' : isSoon ? 'soon' : ''}`}
                      onClick={() => navigate(`/courses/${task.courseId}/subjects/${task.subjectId}`)}
                    >
                      <div className="task-icon">{getTaskIcon(task.type)}</div>
                      <div className="task-info">
                        <h3>{task.title}</h3>
                        <p className="task-course">{task.subjectName}</p>
                        {task.professorName && <p className="task-professor">Prof. {task.professorName}</p>}
                      </div>
                      <div className="task-deadline">
                        <Clock size={16} />
                        <span className={`days ${isUrgent ? 'urgent-text' : ''}`}>
                          {daysUntil === 0 ? 'Hoje' : daysUntil === 1 ? 'Amanhã' : `${daysUntil}d`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Matérias Recentes */}
          {subjects.length > 0 && (
            <section className="dashboard-section">
              <div className="section-header">
                <div className="section-title">
                  <BookOpen size={20} />
                  <h2>Matérias Recentes</h2>
                </div>
                <button 
                  className="view-all-btn"
                  onClick={() => navigate('/courses')}
                  title="Ver todas as matérias"
                >
                  Ver Todas <ChevronRight size={16} />
                </button>
              </div>

              <div className="subjects-grid">
                {subjects.map((subject) => (
                  <div 
                    key={subject.id}
                    className="subject-card"
                    onClick={() => navigate(`/courses/${subject.courseId}/subjects/${subject.id}`)}
                  >
                    <div className="subject-header">
                      <h3>{subject.name}</h3>
                      {subject.type && <span className="subject-type">{subject.type}</span>}
                    </div>
                    <p className="subject-course">{subject.courseName}</p>
                    {subject.description && <p className="subject-description">{subject.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {upcomingTasks.length === 0 && subjects.length === 0 && !loading && (
            <div className="empty-state">
              <h2>Nenhuma atividade pendente</h2>
              <p>Você está em dia com todas as suas tarefas! 🎉</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;