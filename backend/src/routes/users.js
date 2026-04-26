const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

// ============================================================================
// GET: Listar usuarios 
// Rota: GET /api/users?subjectId=1
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const { subjectId } = req.query;

    if (!subjectId) {
      return res.status(400).json({ error: 'subjectId é obrigatório' });
    }

    const tasks = await prisma.task.findMany({
      where: { subjectId: parseInt(subjectId) },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
});

// ============================================================================
// POST: Criar nova tarefa
// Rota: POST /api/tasks
// Body: { "title": "Exercício 1", "type": "ATIVIDADE", "subjectId": 1 }
// ============================================================================
router.post('/', async (req, res) => {
  try {
    const { title, description, type, weight, dueDate, priority, subjectId } = req.body;

    if (!title || !subjectId) {
      return res.status(400).json({ 
        error: 'title e subjectId são obrigatórios' 
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        type: type || 'ATIVIDADE',
        weight: weight || 1.0,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIA',
        subjectId: parseInt(subjectId)
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

// ============================================================================
// PATCH: Marcar tarefa como completa
// Rota: PATCH /api/tasks/1/complete
// Body: { "completed": true }
// ============================================================================
router.patch('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { completed }
    });

    res.json(task);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

// ============================================================================
// PATCH: Atualizar tarefa
// Rota: PATCH /api/tasks/1
// ============================================================================
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, weight, dueDate, priority, completed } = req.body;

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(weight && { weight }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(priority && { priority }),
        ...(completed !== undefined && { completed })
      }
    });

    res.json(task);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

// ============================================================================
// DELETE: Deletar tarefa
// Rota: DELETE /api/tasks/1
// ============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.task.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Tarefa deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({ error: 'Erro ao deletar tarefa' });
  }
});

module.exports = router;