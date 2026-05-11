const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// ============================================================================
// GET: Listar provas de uma matéria
// Rota: GET /api/evaluations?subjectId=1
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const { subjectId } = req.query;

    if (!subjectId) {
      return res.status(400).json({ error: 'subjectId é obrigatório' });
    }

    // Busca todas as tarefas do tipo PROVA da matéria
    const tasks = await prisma.task.findMany({
      where: {
        type: 'PROVA',
        professorSubject: {
          subject: {
            id: parseInt(subjectId)
          }
        }
      },
      include: {
        evaluation: true,
        professorSubject: {
          include: {
            professor: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Erro ao listar provas:', error);
    res.status(500).json({ error: 'Erro ao listar provas' });
  }
});

// ============================================================================
// GET: Obter uma prova específica
// Rota: GET /api/evaluations/:id
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: parseInt(id) },
      include: {
        task: {
          include: {
            professorSubject: {
              include: {
                subject: true,
                professor: true
              }
            }
          }
        }
      }
    });

    if (!evaluation) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    res.json(evaluation);
  } catch (error) {
    console.error('Erro ao obter avaliação:', error);
    res.status(500).json({ error: 'Erro ao obter avaliação' });
  }
});

// ============================================================================
// POST: Criar ou atualizar avaliação para uma tarefa
// Rota: POST /api/evaluations
// Body: { "taskId": 1, "grade": 8.5, "maxGrade": 10, "weight": 30 }
// ============================================================================
router.post('/', async (req, res) => {
  try {
    const { taskId, grade, maxGrade = 10, weight = 1.0 } = req.body;

    if (!taskId || grade === undefined) {
      return res.status(400).json({ 
        error: 'taskId e grade são obrigatórios' 
      });
    }

    // Verifica se tarefa existe
    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) }
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    // Cria ou atualiza avaliação
    const evaluation = await prisma.evaluation.upsert({
      where: { taskId: parseInt(taskId) },
      create: {
        taskId: parseInt(taskId),
        grade: parseFloat(grade),
        maxGrade: parseFloat(maxGrade),
        weight: parseFloat(weight)
      },
      update: {
        grade: parseFloat(grade),
        maxGrade: parseFloat(maxGrade),
        weight: parseFloat(weight)
      }
    });

    res.status(201).json(evaluation);
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

// ============================================================================
// PATCH: Atualizar avaliação
// Rota: PATCH /api/evaluations/:id
// Body: { "grade": 9.0, "weight": 30 }
// ============================================================================
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, maxGrade, weight } = req.body;

    const existing = await prisma.evaluation.findFirst({
      where: {
        id: parseInt(id),
        task: { professorSubject: { subject: { course: { userId: req.userId } } } }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    const evaluation = await prisma.evaluation.update({
      where: { id: parseInt(id) },
      data: {
        ...(grade !== undefined && { grade: parseFloat(grade) }),
        ...(maxGrade !== undefined && { maxGrade: parseFloat(maxGrade) }),
        ...(weight !== undefined && { weight: parseFloat(weight) })
      },
      include: {
        task: true
      }
    });

    res.json(evaluation);
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    res.status(500).json({ error: 'Erro ao atualizar avaliação' });
  }
});

// ============================================================================
// DELETE: Deletar avaliação
// Rota: DELETE /api/evaluations/:id
// ============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.evaluation.findFirst({
      where: {
        id: parseInt(id),
        task: { professorSubject: { subject: { course: { userId: req.userId } } } }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    await prisma.evaluation.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Avaliação deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar avaliação:', error);
    res.status(500).json({ error: 'Erro ao deletar avaliação' });
  }
});

// ============================================================================
// GET: Calcular nota final de uma matéria
// Rota: GET /api/evaluations/subject/1/final-grade
// ============================================================================
router.get('/subject/:subjectId/final-grade', async (req, res) => {
  try {
    const { subjectId } = req.params;

    // Busca todas as tarefas da matéria com suas avaliações
    const tasks = await prisma.task.findMany({
      where: {
        professorSubject: {
          subjectId: parseInt(subjectId)
        }
      },
      include: { evaluation: true }
    });

    // Filtra apenas tarefas avaliadas
    const evaluatedTasks = tasks.filter(t => t.evaluation);

    if (evaluatedTasks.length === 0) {
      return res.json({
        subjectId: parseInt(subjectId),
        finalGrade: 0,
        totalTasks: tasks.length,
        evaluatedTasks: 0,
        grades: []
      });
    }

    // Calcula nota final ponderada
    let totalWeight = 0;
    let weightedSum = 0;

    evaluatedTasks.forEach(task => {
      const normalizedGrade = (task.evaluation.grade / task.evaluation.maxGrade) * 10;
      const weight = task.evaluation.weight;
      
      weightedSum += normalizedGrade * weight;
      totalWeight += weight;
    });

    const finalGrade = (weightedSum / totalWeight).toFixed(2);

    res.json({
      subjectId: parseInt(subjectId),
      finalGrade: parseFloat(finalGrade),
      totalTasks: tasks.length,
      evaluatedTasks: evaluatedTasks.length,
      grades: evaluatedTasks.map(t => ({
        taskId: t.id,
        taskTitle: t.title,
        grade: t.evaluation.grade,
        maxGrade: t.evaluation.maxGrade,
        weight: t.evaluation.weight
      }))
    });
  } catch (error) {
    console.error('Erro ao calcular nota:', error);
    res.status(500).json({ error: 'Erro ao calcular nota' });
  }
});

module.exports = router;