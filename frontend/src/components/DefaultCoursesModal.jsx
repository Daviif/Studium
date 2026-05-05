import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import '../styles/DefaultCoursesModal.css';

const API_URL = import.meta.env.VITE_API_URL;

// Cursos padrões com suas matérias obrigatórias
const DEFAULT_COURSES = [
  {
    id: 'eng-comp',
    name: 'Engenharia da Computação',
    university: 'Padrão',
    description: 'Matérias: Cálculo, Álgebra Linear, Programação, Estrutura de Dados...'
  },
  {
    id: 'sist-info',
    name: 'Sistemas de Informação',
    university: 'Padrão',
    description: 'Matérias: Cálculo, Programação, Banco de Dados, Análise de Sistemas...'
  },
  {
    id: 'eng-eletrica',
    name: 'Engenharia Elétrica',
    university: 'Padrão',
    description: 'Matérias: Cálculo, Álgebra Linear, Eletromagnetismo, Circuitos...'
  },
  {
    id: 'eng-producao',
    name: 'Engenharia de Produção',
    university: 'Padrão',
    description: 'Matérias: Cálculo, Estatística, Contabilidade, Gestão de Operações...'
  }
];

export default function DefaultCoursesModal({ onClose }) {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    console.log('🎓 Modal de cursos padrões foi aberto!');
  }, []);

  const handleSelectCourse = async (course) => {
    console.log('📚 Curso selecionado:', course.name);
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/courses/default/${course.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar curso');
      }

      const courseData = await response.json();
      console.log('✅ Curso criado com sucesso!', courseData);
      console.log(`📚 ${courseData.subjects.length} matérias obrigatórias foram adicionadas`);
      
      // Aguarda um pouco para garantir que os dados foram salvos
      setTimeout(() => {
        // Redireciona para a página de cursos (onde o novo curso aparecerá)
        navigate('/courses');
      }, 500);
    } catch (err) {
      setError(err.message || 'Erro ao criar curso. Tente novamente.');
      console.error('❌ Erro ao criar curso:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    console.log('⏭️ Usuário clicou em "Não, quero criar um curso"');
    // Fecha o modal e permite que o usuário crie um curso customizado na página de cursos
    onClose();
    navigate('/courses');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Bem-vindo ao StudyHub!</h2>
          <button 
            className="modal-close"
            onClick={handleSkip}
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">
            Você cursa algum dos cursos abaixo?
          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="courses-list">
            {DEFAULT_COURSES.map(course => (
              <button
                key={course.id}
                className={`course-option ${selectedCourse?.id === course.id ? 'selected' : ''}`}
                onClick={() => setSelectedCourse(course)}
                disabled={loading}
              >
                <div className="course-checkbox">
                  {selectedCourse?.id === course.id && (
                    <div className="checkbox-checked"></div>
                  )}
                </div>
                <div className="course-info">
                  <h3>{course.name}</h3>
                  <p>{course.description}</p>
                </div>
                <ChevronRight size={20} className="course-chevron" />
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={handleSkip}
            disabled={loading}
          >
            Não, quero criar um curso
          </button>
          <button
            className="btn-primary"
            onClick={() => selectedCourse && handleSelectCourse(selectedCourse)}
            disabled={!selectedCourse || loading}
          >
            {loading ? 'Criando...' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
