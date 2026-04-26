import React, { useState, useEffect } from 'react';
import { professorsApi, subjectsApi } from '../services/api';
import '../styles/ProfessorsModal.css'; // Será criado

export default function ProfessorsModal({ subjectId, isOpen, onClose, token, onProfessorSelected }) {
  const [professors, setProfessors] = useState([]);
  const [allProfessors, setAllProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [semestre, setSemestre] = useState('2025/1');
  const [newProfessorName, setNewProfessorName] = useState('');
  const [showNewProfessor, setShowNewProfessor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Carregar professores da matéria
  useEffect(() => {
    if (isOpen && subjectId) {
      loadProfessors();
      loadAllProfessors();
    }
  }, [isOpen, subjectId]);

  const loadProfessors = async () => {
    try {
      setLoading(true);
      const response = await subjectsApi.getProfessors(subjectId, token);
      setProfessors(response.data);
      if (response.data.length > 0) {
        setSelectedProfessor(response.data[0].id);
      }
    } catch (err) {
      setError('Erro ao carregar professores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllProfessors = async () => {
    try {
      const response = await professorsApi.list(token);
      setAllProfessors(response.data);
    } catch (err) {
      console.error('Erro ao carregar lista de professores:', err);
    }
  };

  const handleAddProfessor = async () => {
    try {
      setLoading(true);
      setError('');

      if (!selectedProfessor || !semestre) {
        setError('Selecione um professor e informe o semestre');
        return;
      }

      await subjectsApi.addProfessor(subjectId, {
        professorId: parseInt(selectedProfessor),
        semestre
      }, token);

      // Recarregar lista
      await loadProfessors();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao adicionar professor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAdd = async () => {
    try {
      setLoading(true);
      setError('');

      if (!newProfessorName.trim() || !semestre) {
        setError('Informe o nome do professor e o semestre');
        return;
      }

      // Criar novo professor
      const profResponse = await professorsApi.create({
        name: newProfessorName,
        email: null
      }, token);

      // Associar à matéria
      await subjectsApi.addProfessor(subjectId, {
        professorId: profResponse.data.id,
        semestre
      }, token);

      // Recarregar listas
      await loadProfessors();
      await loadAllProfessors();

      setNewProfessorName('');
      setShowNewProfessor(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar e adicionar professor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProfessor = async (professorSubjectId) => {
    if (window.confirm('Deseja remover este professor da matéria?')) {
      try {
        setLoading(true);
        await subjectsApi.removeProfessor(subjectId, professorSubjectId, token);
        await loadProfessors();
      } catch (err) {
        setError('Erro ao remover professor');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectProfessor = (professorSubject) => {
    setSelectedProfessor(professorSubject.id);
    onProfessorSelected?.(professorSubject);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="professors-modal-overlay" onClick={onClose}>
      <div className="professors-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Professores da Matéria</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          {/* Lista de Professores Associados */}
          <div className="professors-list">
            <h3>Professores Associados</h3>
            {loading ? (
              <p>Carregando...</p>
            ) : professors.length === 0 ? (
              <p className="empty">Nenhum professor associado ainda</p>
            ) : (
              <div className="professors-grid">
                {professors.map((ps) => (
                  <div
                    key={ps.id}
                    className={`professor-card ${selectedProfessor === ps.id ? 'selected' : ''}`}
                    onClick={() => handleSelectProfessor(ps)}
                  >
                    <div className="professor-info">
                      <h4>{ps.professor.name}</h4>
                      <p className="semestre">📅 {ps.semestre}</p>
                      {ps.professor.email && (
                        <p className="email">📧 {ps.professor.email}</p>
                      )}
                    </div>
                    <button
                      className="remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveProfessor(ps.id);
                      }}
                      disabled={loading}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Adicionar Professor */}
          <div className="add-professor-section">
            <h3>Adicionar Professor</h3>

            {!showNewProfessor ? (
              <>
                {allProfessors.length > 0 && (
                  <div className="form-group">
                    <label>Selecionar professor existente:</label>
                    <select
                      value={selectedProfessor || ''}
                      onChange={(e) => setSelectedProfessor(parseInt(e.target.value))}
                    >
                      <option value="">-- Escolha um professor --</option>
                      {allProfessors.map((prof) => (
                        <option key={prof.id} value={prof.id}>
                          {prof.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Semestre:</label>
                  <input
                    type="text"
                    placeholder="Ex: 2025/1, 2026/2"
                    value={semestre}
                    onChange={(e) => setSemestre(e.target.value)}
                  />
                </div>

                <div className="button-group">
                  <button
                    className="btn-primary"
                    onClick={handleAddProfessor}
                    disabled={loading || !selectedProfessor}
                  >
                    {loading ? 'Adicionando...' : 'Adicionar Professor'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowNewProfessor(true)}
                  >
                    Criar Novo Professor
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Nome do Professor:</label>
                  <input
                    type="text"
                    placeholder="Ex: Prof. João Silva"
                    value={newProfessorName}
                    onChange={(e) => setNewProfessorName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Semestre:</label>
                  <input
                    type="text"
                    placeholder="Ex: 2025/1"
                    value={semestre}
                    onChange={(e) => setSemestre(e.target.value)}
                  />
                </div>

                <div className="button-group">
                  <button
                    className="btn-primary"
                    onClick={handleCreateAndAdd}
                    disabled={loading || !newProfessorName.trim()}
                  >
                    {loading ? 'Criando...' : 'Criar e Adicionar'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowNewProfessor(false);
                      setNewProfessorName('');
                    }}
                  >
                    Voltar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
