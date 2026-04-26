const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// ============================================================================
// POST: Criar avaliação para uma tarefa
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
// GET: Calcular nota final de uma matéria
// Rota: GET /api/evaluations/subject/1/final-grade
// ============================================================================
router.get('/subject/:subjectId/final-grade', async (req, res) => {
  try {
    const { subjectId } = req.params;

    // Busca todas as tarefas da matéria com suas avaliações
    const tasks = await prisma.task.findMany({
      where: { subjectId: parseInt(subjectId) },
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