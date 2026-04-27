import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { coursesApi, subjectsApi } from '../services/api';
import './CourseDetails.css';

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [course, setCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    period: '',
    type: 'OBRIGATORIA'
  });

  useEffect(() => {
    loadCourseDetails();
  }, [courseId, token]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      setError('');

      // Carrega detalhes do curso
      const courseResponse = await coursesApi.get(courseId, token);
      setCourse(courseResponse.data);

      // Carrega matérias do curso
      const subjectsResponse = await subjectsApi.list(courseId, token);
      setSubjects(subjectsResponse.data || []);
    } catch (err) {
      console.error('Erro ao carregar curso:', err);
      setError('Não foi possível carregar o curso');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();

    const name = formData.name.trim();
    if (!name) {
      setError('Nome da matéria é obrigatório');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      await subjectsApi.create(
        {
          name,
          period: formData.period || null,
          type: formData.type,
          courseId: parseInt(courseId)
        },
        token
      );

      setFormData({ name: '', period: '', type: 'OBRIGATORIA' });
      setIsModalOpen(false);
      await loadCourseDetails();
    } catch (err) {
      console.error('Erro ao criar matéria:', err);
      const apiMessage = err?.response?.data?.error;
      setError(apiMessage || 'Erro ao criar matéria. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm(`Tem certeza que deseja deletar o curso "${course.name}"? Esta ação não pode ser desfeita e todas as matérias, tarefas e arquivos serão perdidos.`)) {
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      await coursesApi.delete(courseId, token);

      // Redireciona para a página inicial após deletar
      navigate('/');
    } catch (err) {
      console.error('Erro ao deletar curso:', err);
      const apiMessage = err?.response?.data?.error;
      setError(apiMessage || 'Erro ao deletar curso. Tente novamente.');
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="course-details-container">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-details-container">
        <button className="back-button" onClick={() => navigate('/courses')}>
          <ArrowLeft size={20} />
          Voltar
        </button>
        <p>Curso não encontrado</p>
      </div>
    );
  }

        <button
          className="delete-course-button"
          onClick={handleDeleteCourse}
          type="button"
          title="Deletar curso"
          disabled={isSaving}
        >
          <Trash2 size={18} />
        </button>

  return (
    <div className="course-details-container">
      <div className="course-details-header">
        <button className="back-button" onClick={() => navigate('/courses')} title="Voltar">
          <ArrowLeft size={20} />
        </button>

        <div className="course-info">
          <h1>{course.name}</h1>
          <p>{course.university}</p>
        </div>

        <button
          className="add-subject-button"
          onClick={() => setIsModalOpen(true)}
          type="button"
        >
          <Plus size={18} />
          Nova Matéria
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="subjects-section">
        <h2>Matérias</h2>

        {subjects.length === 0 ? (
          <div className="empty-subjects">
            <div className="empty-icon">
              <BookOpen size={32} />
            </div>
            <p>Nenhuma matéria cadastrada</p>
            <button
              className="primary-button"
              onClick={() => setIsModalOpen(true)}
              type="button"
            >
              Adicionar Primeira Matéria
            </button>
          </div>
        ) : (
          <div className="subjects-by-period">
            {(() => {
              // Normalizar: tratar type undefined como OBRIGATORIA
              const normalizedSubjects = subjects.map(s => ({
                ...s,
                type: s.type || 'OBRIGATORIA'
              }));

              // Separar matérias obrigatórias das outras
              const obrigatorias = normalizedSubjects.filter(s => s.type === 'OBRIGATORIA');
              const naoObrigatorias = normalizedSubjects.filter(s => s.type !== 'OBRIGATORIA');

              // Agrupar obrigatórias por período
              const groupedObrigatorias = obrigatorias.reduce((groups, subject) => {
                const period = subject.period || 'sem-periodo';
                if (!groups[period]) {
                  groups[period] = [];
                }
                groups[period].push(subject);
                return groups;
              }, {});

              // Ordenar períodos das obrigatórias
              const periodosOrdenados = Object.keys(groupedObrigatorias)
                .filter(p => p !== 'sem-periodo')
                .sort((a, b) => {
                  const numA = parseInt(a);
                  const numB = parseInt(b);
                  if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                  }
                  return 0;
                });

              if (groupedObrigatorias['sem-periodo']) {
                periodosOrdenados.push('sem-periodo');
              }

              // Agrupar não-obrigatórias primeiro por tipo, depois por período
              const groupedNaoObrigatorias = {};
              const tiposOrdenados = ['ELETIVA', 'OPTATIVA', 'FACULTATIVA', 'EXTENSAO'];

              tiposOrdenados.forEach(tipo => {
                const subjectsOfType = naoObrigatorias.filter(s => s.type === tipo);
                if (subjectsOfType.length > 0) {
                  groupedNaoObrigatorias[tipo] = subjectsOfType.reduce((groups, subject) => {
                    const period = subject.period || 'sem-periodo';
                    if (!groups[period]) {
                      groups[period] = [];
                    }
                    groups[period].push(subject);
                    return groups;
                  }, {});
                }
              });

              // Combinação final
              const allGroups = [];

              // Adicionar períodos de obrigatórias
              periodosOrdenados.forEach(p => {
                allGroups.push({
                  key: `obrigatorio-${p}`,
                  label: `${p === 'sem-periodo' ? 'Sem Período' : p + 'º Período'}`,
                  items: groupedObrigatorias[p],
                  isObrigatorio: true
                });
              });

              // Adicionar não-obrigatórias por tipo
              tiposOrdenados.forEach(tipo => {
                if (groupedNaoObrigatorias[tipo]) {
                  const labels = {
                    ELETIVA: 'Eletiva',
                    OPTATIVA: 'Optativa',
                    FACULTATIVA: 'Facultativa',
                    EXTENSAO: 'Extensão'
                  };

                  // Ordenar períodos dentro do tipo
                  const periodosDoTipo = Object.keys(groupedNaoObrigatorias[tipo])
                    .filter(p => p !== 'sem-periodo')
                    .sort((a, b) => {
                      const numA = parseInt(a);
                      const numB = parseInt(b);
                      if (!isNaN(numA) && !isNaN(numB)) {
                        return numA - numB;
                      }
                      return 0;
                    });

                  if (groupedNaoObrigatorias[tipo]['sem-periodo']) {
                    periodosDoTipo.push('sem-periodo');
                  }

                  // Adicionar como grupo principal do tipo
                  allGroups.push({
                    key: `tipo-${tipo}`,
                    label: labels[tipo],
                    items: [],
                    isMainType: true,
                    subGroups: periodosDoTipo.map(p => ({
                      key: `${tipo}-${p}`,
                      label: p === 'sem-periodo' ? 'Sem Período' : `${p}º Período`,
                      items: groupedNaoObrigatorias[tipo][p]
                    }))
                  });
                }
              });

              return allGroups.map(group => (
                <div key={group.key}>
                  <div key={group.key} className="period-group">
                    <h3 className="period-title">{group.label}</h3>
                    {!group.isMainType && (
                      <div className="subjects-grid">
                        {group.items.map((subject) => (
                          <div
                            key={subject.id}
                            className="subject-card"
                            onClick={() => navigate(`/courses/${courseId}/subjects/${subject.id}`)}
                          >
                            <h3>{subject.name}</h3>
                            <p className="subject-tasks">
                              {subject.tasks?.length || 0} tarefas
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {group.isMainType && group.subGroups && (
                    <div className="sub-periods">
                      {group.subGroups.map(subGroup => (
                        <div key={subGroup.key} className="period-group" style={{ marginLeft: '16px' }}>
                          <h4 className="sub-period-title">{subGroup.label}</h4>
                          <div className="subjects-grid">
                            {subGroup.items.map((subject) => (
                              <div
                                key={subject.id}
                                className="subject-card"
                                onClick={() => navigate(`/courses/${courseId}/subjects/${subject.id}`)}
                              >
                                <h3>{subject.name}</h3>
                                <p className="subject-tasks">
                                  {subject.tasks?.length || 0} tarefas
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => !isSaving && setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nova Matéria</h2>
            <p>Adicione uma matéria ao curso "{course.name}"</p>

            <form onSubmit={handleCreateSubject}>
              <label htmlFor="subject-name">Nome da Matéria</label>
              <input
                id="subject-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Cálculo I"
                disabled={isSaving}
              />

              <label htmlFor="subject-period">Período</label>
              <input
                id="subject-period"
                type="text"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                placeholder="Ex: 1º período"
                disabled={isSaving}
              />

              <label htmlFor="subject-type">Tipo</label>
              <select
                id="subject-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                disabled={isSaving}
              >
                <option value="OBRIGATORIA">Obrigatória</option>
                <option value="ELETIVA">Eletiva</option>
                <option value="OPTATIVA">Optativa</option>
                <option value="FACULTATIVA">Facultativa</option>
                <option value="EXTENSAO">Extensão</option>
              </select>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : 'Salvar Matéria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
