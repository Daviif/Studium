import {
  GraduationCap,
  LogOut,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Courses.css';

export default function CoursesPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    university: '',
  });

  const loadCourses = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await coursesApi.list(token);
      const coursesData = Array.isArray(response.data) ? response.data : [];
      setCourses(coursesData);
    } catch (error) {
      setErrorMessage('Não foi possível carregar os cursos agora.');
      console.error('Erro ao carregar cursos:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [token]);

  const openNewCourseModal = () => {
    setFormData({ name: '', university: '' });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const closeNewCourseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  const handleCreateCourse = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const university = formData.university.trim();

    if (!name || !university) {
      setErrorMessage('Preencha nome do curso e universidade.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');

      await coursesApi.create({ name, university }, token);

      setIsModalOpen(false);
      await loadCourses();
    } catch (error) {
      const apiMessage = error?.response?.data?.error;
      setErrorMessage(apiMessage || 'Erro ao criar curso. Tente novamente.');
      console.error('Erro ao criar curso:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="main">
      <header className="topbar">
        
        <button className="back-button" onClick={() => navigate('/')} title="Voltar">
            <ArrowLeft size={20} />
        </button>
            

        <div>
          <h1>Meus Cursos</h1>
          <p>Gerencie sua trajetória acadêmica</p>
        </div>

        <div className="topbar-actions">
          <button className="primary-button" type="button" onClick={openNewCourseModal}>
            <Plus size={16} />
            Novo Curso
          </button>
        </div>
      </header>

      <section className="content">
        {loading ? <p className="feedback">Carregando cursos...</p> : null}

        {!loading && errorMessage ? <p className="feedback feedback-error">{errorMessage}</p> : null}

        {!loading && courses.length === 0 ? (
          <section className="empty-state-card">
            <div className="empty-icon-wrap">
              <GraduationCap size={28} />
            </div>

            <p className="empty-text">Nenhum curso cadastrado ainda.</p>

            <button className="primary-button" type="button" onClick={openNewCourseModal}>
              Começar Agora
            </button>
          </section>
        ) : null}

        {!loading && courses.length > 0 ? (
          <section className="courses-grid">
            {courses.map((course) => (
              <article
                className="course-card"
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <h3>{course.name}</h3>
                <p>{course.university}</p>
                <span>{course.subjects?.length || 0} matérias</span>
              </article>
            ))}
          </section>
        ) : null}
      </section>

      {isModalOpen ? (
        <div className="modal-backdrop" onClick={closeNewCourseModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>Novo Curso</h2>
            <p>Preencha os dados para cadastrar no banco.</p>

            <form onSubmit={handleCreateCourse}>
              <label htmlFor="course-name">Nome do curso</label>
              <input
                id="course-name"
                type="text"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Ex: Sistemas de Informação"
              />

              <label htmlFor="course-university">Universidade</label>
              <input
                id="course-university"
                type="text"
                value={formData.university}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    university: event.target.value,
                  }))
                }
                placeholder="Ex: UFC"
              />

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={closeNewCourseModal}>
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
