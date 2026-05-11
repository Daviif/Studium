import React, { useState, useEffect } from 'react';
import { AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { tasksApi } from '../services/api';
import '../styles/QuickShortcuts.css';

export default function QuickShortcuts() {
  const { token } = useAuth();
  const [data, setData] = useState({
    upcomingTasks: [],
    prioritySubjects: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuickData();
  }, [token]);

  const loadQuickData = async () => {
    try {
      setLoading(true);

      // Uma única chamada para buscar todas as tarefas do usuário
      const allTasksResponse = await tasksApi.getAllTasks(token);
      const allTasksList = Array.isArray(allTasksResponse.data) ? allTasksResponse.data : [];

      const incompleteTasks = allTasksList.filter(task => !task.completed);

      // Agregar tarefas por matéria
      const subjectsTaskCount = {};
      incompleteTasks.forEach(task => {
        const subjectId = task.professorSubject?.subject?.id;
        if (!subjectId) return;
        if (!subjectsTaskCount[subjectId]) {
          subjectsTaskCount[subjectId] = {
            name: task.subjectName || task.professorSubject.subject.name,
            count: 0,
            subjectId
          };
        }
        subjectsTaskCount[subjectId].count += 1;
      });

      // Filtrar tarefas prestes a expirar (próximos 7 dias)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const upcomingTasks = incompleteTasks
        .filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate >= today && dueDate <= sevenDaysFromNow;
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);

      const prioritySubjects = Object.values(subjectsTaskCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      setData({ upcomingTasks, prioritySubjects });
    } catch (error) {
      console.error('Erro ao carregar dados rápidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatus = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { type: 'overdue', label: `${Math.abs(diffDays)}d atrasada`, color: '#e74c3c' };
    if (diffDays === 0) return { type: 'today', label: 'Hoje!', color: '#f39c12' };
    if (diffDays === 1) return { type: 'tomorrow', label: 'Amanhã', color: '#f39c12' };
    if (diffDays <= 7) return { type: 'soon', label: `${diffDays}d`, color: '#3498db' };
    return { type: 'normal', label: `${diffDays}d`, color: '#95a5a6' };
  };

  if (loading) {
    return (
      <div className="quick-shortcuts">
        <p className="loading-text">Carregando atalhos rápidos...</p>
      </div>
    );
  }

  const hasData = data.upcomingTasks.length > 0 || data.prioritySubjects.length > 0;

  if (!hasData) {
    return null;
  }

  return (
    <div className="quick-shortcuts">
      <h2 className="shortcuts-title">⚡ Atalhos Rápidos</h2>

      <div className="shortcuts-grid">
        {/* Seção: Tarefas Prestes a Expirar */}
        {data.upcomingTasks.length > 0 && (
          <div className="shortcut-card urgent-card">
            <div className="card-header">
              <AlertCircle size={20} className="card-icon" />
              <h3>Tarefas Urgentes</h3>
            </div>
            <div className="shortcuts-list">
              {data.upcomingTasks.map((task) => {
                const status = getTaskStatus(task.dueDate);
                return (
                  <div key={task.id} className="shortcut-item urgent-item">
                    <div className="item-content">
                      <p className="item-title">{task.title}</p>
                      <p className="item-subject">{task.subjectName}</p>
                    </div>
                    <span 
                      className="item-badge urgent-badge"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Seção: Matérias Prioritárias */}
        {data.prioritySubjects.length > 0 && (
          <div className="shortcut-card priority-card">
            <div className="card-header">
              <Zap size={20} className="card-icon" />
              <h3>Matérias Prioritárias</h3>
            </div>
            <div className="shortcuts-list">
              {data.prioritySubjects.map((subject) => (
                <div key={subject.subjectId} className="shortcut-item priority-item">
                  <div className="item-content">
                    <p className="item-title">{subject.name}</p>
                    <p className="item-meta">{subject.count} tarefa{subject.count !== 1 ? 's' : ''} pendente{subject.count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="priority-badge">{subject.count}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
