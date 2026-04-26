const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

// ============================================================================
// GET: Listar matérias de um curso
// Rota: GET /api/subjects?courseId=1
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId é obrigatório' });
    }

    const subjects = await prisma.subject.findMany({
      where: { courseId: parseInt(courseId) },
      include: {
        tasks: true,
        routines: true
      }
    });

    res.json(subjects);
  } catch (error) {
    console.error('Erro ao buscar matérias:', error);
    res.status(500).json({ error: 'Erro ao buscar matérias' });
  }
});

// ============================================================================
// GET: Detalhes de uma matéria específica
// Rota: GET /api/subjects/1
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(id) },
      include: {
        tasks: true,
        routines: true
      }
    });

    if (!subject) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    res.json(subject);
  } catch (error) {
    console.error('Erro ao buscar matéria:', error);
    res.status(500).json({ error: 'Erro ao buscar matéria' });
  }
});

// ============================================================================
// GET: Detalhes de uma matéria específica com progresso
// Rota: GET /api/subjects/1/progress
// ============================================================================
router.get('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(id) },
      include: { tasks: true }
    });

    if (!subject) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    // ========================================================================
    // 🧠 CÁLCULO DO PROGRESSO (Lógica do Backend)
    // ========================================================================
    const tasks = subject.tasks;
    
    if (tasks.length === 0) {
      return res.json({
        subjectId: subject.id,
        subjectName: subject.name,
        progress: 0,
        totalTasks: 0,
        completedTasks: 0
      });
    }

    // Soma dos pesos de todas as tarefas
    const totalWeight = tasks.reduce((sum, task) => sum + task.weight, 0);

    // Soma dos pesos das tarefas completas
    const completedWeight = tasks
      .filter(task => task.completed)
      .reduce((sum, task) => sum + task.weight, 0);

    // Calcula percentual
    const progress = Math.round((completedWeight / totalWeight) * 100);

    res.json({
      subjectId: subject.id,
      subjectName: subject.name,
      progress,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.completed).length,
      totalWeight: parseFloat(totalWeight.toFixed(2)),
      completedWeight: parseFloat(completedWeight.toFixed(2))
    });
  } catch (error) {
    console.error('Erro ao calcular progresso:', error);
    res.status(500).json({ error: 'Erro ao calcular progresso' });
  }
});

// ============================================================================
// POST: Criar nova matéria
// Rota: POST /api/subjects
// Body: { "name": "POO", "description": "...", "courseId": 1 }
// ============================================================================
router.post('/', async (req, res) => {
  try {
    const { name, description, courseId, period } = req.body;
    const userId = req.userId; // Vem do middleware de autenticação

    if (!name || !courseId) {
      return res.status(400).json({ 
        error: 'name e courseId são obrigatórios' 
      });
    }

    // Verificar se o curso pertence ao usuário autenticado
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) }
    });

    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    if (course.userId !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar este curso' });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        description: description || '',
        period: period || null,
        courseId: parseInt(courseId)
      }
    });

    res.status(201).json(subject);
  } catch (error) {
    console.error('Erro ao criar matéria:', error);
    res.status(500).json({ error: 'Erro ao criar matéria' });
  }
});

// ============================================================================
// PATCH: Atualizar matéria
// Rota: PATCH /api/subjects/1
// ============================================================================
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, period, professor, semestre } = req.body;

    const subject = await prisma.subject.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(period !== undefined && { period }),
        ...(professor !== undefined && { professor }),
        ...(semestre !== undefined && { semestre })
      }
    });

    res.json(subject);
  } catch (error) {
    console.error('Erro ao atualizar matéria:', error);
    res.status(500).json({ error: 'Erro ao atualizar matéria' });
  }
});

// ============================================================================
// DELETE: Deletar matéria
// Rota: DELETE /api/subjects/1
// ============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.subject.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Matéria deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar matéria:', error);
    res.status(500).json({ error: 'Erro ao deletar matéria' });
  }
});

module.exports = router;