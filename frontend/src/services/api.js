import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

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
  })
};

// ============================================================================
// TAREFAS
// ============================================================================
export const tasksApi = {
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

export default api;