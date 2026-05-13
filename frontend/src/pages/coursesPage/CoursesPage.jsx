import { GraduationCap, Plus, Edit2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Courses.css';

// Paleta de cores para os badges das iniciais
const BADGE_COLORS = [
  { bg: '#dbeafe', color: '#1e40af' },
  { bg: '#e0e7ff', color: '#3730a3' },
  { bg: '#fef3c7', color: '#92400e' },
  { bg: '#d1fae5', color: '#065f46' },
  { bg: '#fce7f3', color: '#9d174d' },
  { bg: '#fde8d8', color: '#9a3412' },
];

export default function CoursesPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [courses,         setCourses]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [isSaving,        setIsSaving]        = useState(false);
  const [formData,        setFormData]        = useState({ name: '', university: '' });

  useEffect(() => { load(); }, [token]);

  async function load() {
    try {
      setLoading(true); setError('');
      const res = await coursesApi.list(token);
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Não foi possível carregar os cursos.');
      setCourses([]);
    } finally { setLoading(false); }
  }

  function openNew() {
    setEditingCourseId(null);
    setFormData({ name: '', university: '' });
    setError('');
    setIsModalOpen(true);
  }

  function openEdit(course) {
    setEditingCourseId(course.id);
    setFormData({ name: course.name, university: course.university });
    setError('');
    setIsModalOpen(true);
  }

  function closeModal() { if (!isSaving) setIsModalOpen(false); }

  async function handleSave(e) {
    e.preventDefault();
    const name = formData.name.trim();
    const university = formData.university.trim();
    if (!name || !university) { setError('Preencha todos os campos.'); return; }

    try {
      setIsSaving(true); setError('');
      if (editingCourseId) {
        await coursesApi.update(editingCourseId, { name, university }, token);
      } else {
        await coursesApi.create({ name, university }, token);
      }
      setIsModalOpen(false);
      setEditingCourseId(null);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao salvar. Tente novamente.');
    } finally { setIsSaving(false); }
  }

  async function handleDelete(courseId, e) {
    e.stopPropagation();
    if (!confirm('Deletar este curso? Todas as matérias serão removidas.')) return;
    try {
      setError('');
      await coursesApi.delete(courseId, token);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao deletar.');
    }
  }

  const totalSubjects = courses.reduce((s, c) => s + (c.subjects?.length || 0), 0);

  return (
    <div className="cp-page">
      <div className="cp-inner">

        {/* Cabeçalho */}
        <div className="cp-header">
          <div>
            <h1 className="cp-title">Meus Cursos</h1>
            <p className="cp-subtitle">
              {loading ? 'Carregando…'
                : `${courses.length} curso${courses.length !== 1 ? 's' : ''} · ${totalSubjects} matéria${totalSubjects !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="cp-new-btn" onClick={openNew}>
            <Plus size={15} /> Novo Curso
          </button>
        </div>

        {/* Erro */}
        {error && <div className="cp-error">{error}</div>}

        {/* Empty state */}
        {!loading && courses.length === 0 && (
          <div className="cp-empty">
            <div className="cp-empty-icon"><GraduationCap size={36} /></div>
            <p className="cp-empty-title">Nenhum curso cadastrado ainda</p>
            <p className="cp-empty-sub">Adicione seu primeiro curso para começar a organizar sua vida acadêmica.</p>
            <button className="cp-new-btn" onClick={openNew}>
              <Plus size={15} /> Adicionar Curso
            </button>
          </div>
        )}

        {/* Grid de cursos */}
        {!loading && courses.length > 0 && (
          <div className="cp-grid">
            {courses.map((course, i) => {
              const col = BADGE_COLORS[i % BADGE_COLORS.length];
              const initial = course.name.trim()[0]?.toUpperCase() || '?';
              return (
                <article
                  key={course.id}
                  className="cp-card"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  {/* Topo do card */}
                  <div className="cp-card-top">
                    <div className="cp-badge" style={{ background: col.bg, color: col.color }}>
                      {initial}
                    </div>
                    <div className="cp-card-actions" onClick={e => e.stopPropagation()}>
                      <button
                        className="cp-action-btn"
                        onClick={() => openEdit(course)}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="cp-action-btn cp-action-del"
                        onClick={e => handleDelete(course.id, e)}
                        title="Deletar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="cp-card-body">
                    <h3 className="cp-card-name">{course.name}</h3>
                    <p className="cp-card-uni">{course.university}</p>
                  </div>

                  {/* Rodapé */}
                  <div className="cp-card-foot">
                    <span
                      className="cp-subjects-badge"
                      style={{ background: col.bg, color: col.color }}
                    >
                      {course.subjects?.length || 0} matéria{(course.subjects?.length || 0) !== 1 ? 's' : ''}
                    </span>
                    <span className="cp-card-arrow">→</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="cp-overlay" onClick={closeModal}>
          <div className="cp-modal" onClick={e => e.stopPropagation()}>
            <h2 className="cp-modal-title">
              {editingCourseId ? 'Editar Curso' : 'Novo Curso'}
            </h2>
            <p className="cp-modal-sub">
              {editingCourseId ? 'Atualize as informações do curso.' : 'Preencha os dados para adicionar um novo curso.'}
            </p>

            {error && <div className="cp-modal-error">{error}</div>}

            <form onSubmit={handleSave}>
              <div className="cp-form-field">
                <label>NOME DO CURSO</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Sistemas de Informação"
                  disabled={isSaving}
                />
              </div>
              <div className="cp-form-field">
                <label>UNIVERSIDADE</label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={e => setFormData(p => ({ ...p, university: e.target.value }))}
                  placeholder="Ex: UFOP"
                  disabled={isSaving}
                />
              </div>
              <div className="cp-modal-actions">
                <button type="button" className="cp-cancel-btn" onClick={closeModal} disabled={isSaving}>
                  Cancelar
                </button>
                <button type="submit" className="cp-save-btn" disabled={isSaving}>
                  {isSaving ? 'Salvando…' : editingCourseId ? 'Atualizar' : 'Criar Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
