const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

// ============================================================================
// GET: Listar rotinas de uma matéria
// Rota: GET /api/routines?subjectId=1
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const { subjectId } = req.query;

    if (!subjectId) {
      return res.status(400).json({ error: 'subjectId é obrigatório' });
    }

    const routines = await prisma.routine.findMany({
      where: { subjectId: parseInt(subjectId) },
      orderBy: { dayOfWeek: 'asc' }
    });

    res.json(routines);
  } catch (error) {
    console.error('Erro ao buscar rotinas:', error);
    res.status(500).json({ error: 'Erro ao buscar rotinas' });
  }
});

// ============================================================================
// POST: Criar nova rotina
// Rota: POST /api/routines
// Body: { "dayOfWeek": "SEGUNDA", "startTime": "14:30", "duration": 90, "activity": "Revisar slides", "subjectId": 1 }
// ============================================================================
router.post('/', async (req, res) => {
  try {
    const { dayOfWeek, startTime, duration, activity, subjectId } = req.body;

    if (!dayOfWeek || !startTime || !duration || !activity || !subjectId) {
      return res.status(400).json({ 
        error: 'dayOfWeek, startTime, duration, activity e subjectId são obrigatórios' 
      });
    }

    const routine = await prisma.routine.create({
      data: {
        dayOfWeek,
        startTime,
        duration: parseInt(duration),
        activity,
        subjectId: parseInt(subjectId)
      }
    });

    res.status(201).json(routine);
  } catch (error) {
    console.error('Erro ao criar rotina:', error);
    res.status(500).json({ error: 'Erro ao criar rotina' });
  }
});

// ============================================================================
// DELETE: Deletar rotina
// Rota: DELETE /api/routines/1
// ============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.routine.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Rotina deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar rotina:', error);
    res.status(500).json({ error: 'Erro ao deletar rotina' });
  }
});

module.exports = router;