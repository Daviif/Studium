import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============================================================================
// CURSOS
// ============================================================================
export const coursesApi = {
  list: (token) => api.get('/courses', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  get: (id, token) => api.get(`/courses/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  create: (data, token) => api.post('/courses', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  update: (id, data, token) => api.patch(`/courses/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  delete: (id, token) => api.delete(`/courses/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
};

// ============================================================================
// PROFESSORES
// ============================================================================
export const professorsApi = {
  list: (token) => api.get('/professors', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  get: (id, token) => api.get(`/professors/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  create: (data, token) => api.post('/professors', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  update: (id, data, token) => api.patch(`/professors/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  delete: (id, token) => api.delete(`/professors/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
};

// ============================================================================
// MATÉRIAS
// ============================================================================
export const subjectsApi = {
  list: (courseId, token) => api.get(`/subjects?courseId=${courseId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  get: (id, token) => api.get(`/subjects/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  create: (data, token) => api.post('/subjects', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateProgress: (id, token) => api.get(`/subjects/${id}/progress`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  update: (id, data, token) => api.patch(`/subjects/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  delete: (id, token) => api.delete(`/subjects/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Professor-Subject
  getProfessors: (subjectId, token) => api.get(`/subjects/${subjectId}/professors`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  addProfessor: (subjectId, data, token) => api.post(`/subjects/${subjectId}/professors`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  removeProfessor: (subjectId, professorSubjectId, token) => api.delete(`/subjects/${subjectId}/professors/${professorSubjectId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
};

// ============================================================================
// TAREFAS
// ============================================================================
export const tasksApi = {
  // Novo: aceita professorSubjectId
  listByProfessor: (professorSubjectId, token) => api.get(`/tasks?professorSubjectId=${professorSubjectId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Antigo: mantém compatibilidade com subjectId
  list: (subjectId, token) => api.get(`/tasks?subjectId=${subjectId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  get: (id, token) => api.get(`/tasks/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  create: (data, token) => api.post('/tasks', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  complete: (id, completed, token) => api.patch(`/tasks/${id}/complete`, { completed }, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  update: (id, data, token) => api.patch(`/tasks/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  delete: (id, token) => api.delete(`/tasks/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
};

// ============================================================================
// ROTINAS
// ============================================================================
export const routinesApi = {
  // Novo: aceita professorSubjectId
  listByProfessor: (professorSubjectId, token) => api.get(`/routines?professorSubjectId=${professorSubjectId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Antigo: mantém compatibilidade com subjectId
  list: (subjectId, token) => api.get(`/routines?subjectId=${subjectId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  create: (data, token) => api.post('/routines', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  delete: (id, token) => api.delete(`/routines/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
};

// ============================================================================
// ARQUIVOS
// ============================================================================
export const filesApi = {
  // Novo: aceita professorSubjectId
  listByProfessor: (professorSubjectId, token) => api.get(`/files?professorSubjectId=${professorSubjectId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Antigo: mantém compatibilidade com subjectId
  list: (subjectId, token) => api.get(`/files?subjectId=${subjectId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  upload: (formData, token) => api.post('/files/upload', formData, {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  }),
  delete: (id, token) => api.delete(`/files/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
};

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  profile: (token) => api.get('/auth/profile', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateProfile: (data, token) => api.patch('/auth/profile', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  changePassword: (data, token) => api.post('/auth/change-password', data, {
    headers: { Authorization: `Bearer ${token}` }
  })
};

// ============================================================================
// AVALIAÇÕES (Provas com Peso e Notas)
// ============================================================================
export const evaluationsApi = {
  // Listar provas de uma matéria
  list: (subjectId, token) => api.get(`/evaluations?subjectId=${subjectId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Obter uma avaliação específica
  get: (id, token) => api.get(`/evaluations/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Criar ou atualizar avaliação
  create: (data, token) => api.post('/evaluations', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Atualizar avaliação
  update: (id, data, token) => api.patch(`/evaluations/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Deletar avaliação
  delete: (id, token) => api.delete(`/evaluations/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
};

export default api;