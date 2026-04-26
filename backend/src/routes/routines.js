const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

// ============================================================================
// GET: Listar rotinas de um professor-matéria
// Rota: GET /api/routines?professorSubjectId=1
// Query params opcionais: subjectId (para compatibilidade)
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const { professorSubjectId, subjectId } = req.query;

    if (!professorSubjectId && !subjectId) {
      return res.status(400).json({ 
        error: 'professorSubjectId ou subjectId é obrigatório' 
      });
    }

    let where = {};
    
    if (professorSubjectId) {
      where = { professorSubjectId: parseInt(professorSubjectId) };
    } else if (subjectId) {
      // Se fornecido apenas subjectId, buscar o primeiro professorSubject
      const professorSubject = await prisma.professorSubject.findFirst({
        where: { subjectId: parseInt(subjectId) },
        orderBy: { createdAt: 'desc' }
      });

      if (!professorSubject) {
        return res.status(404).json({ 
          error: 'Nenhum professor encontrado para esta matéria' 
        });
      }

      where = { professorSubjectId: professorSubject.id };
    }

    const routines = await prisma.routine.findMany({
      where,
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
// Body: { "dayOfWeek": "SEGUNDA", "startTime": "14:30", "duration": 90, "activity": "Revisar slides", "professorSubjectId": 1 }
// ============================================================================
router.post('/', async (req, res) => {
  try {
    const { dayOfWeek, startTime, duration, activity, professorSubjectId, subjectId } = req.body;

    // Priorizar professorSubjectId
    let finalProfessorSubjectId = professorSubjectId;

    if (!dayOfWeek || !startTime || !duration || !activity) {
      return res.status(400).json({ 
        error: 'dayOfWeek, startTime, duration e activity são obrigatórios' 
      });
    }

    if (!finalProfessorSubjectId && subjectId) {
      // Se fornecido apenas subjectId, buscar o primeiro professorSubject
      const professorSubject = await prisma.professorSubject.findFirst({
        where: { subjectId: parseInt(subjectId) }
      });

      if (!professorSubject) {
        return res.status(400).json({ 
          error: 'Nenhum professor encontrado para esta matéria. Use professorSubjectId.' 
        });
      }

      finalProfessorSubjectId = professorSubject.id;
    }

    if (!finalProfessorSubjectId) {
      return res.status(400).json({ 
        error: 'professorSubjectId é obrigatório' 
      });
    }

    // Verificar se o professorSubject existe
    const professorSubject = await prisma.professorSubject.findUnique({
      where: { id: parseInt(finalProfessorSubjectId) }
    });

    if (!professorSubject) {
      return res.status(404).json({ 
        error: 'Professor-Matéria não encontrado' 
      });
    }

    const routine = await prisma.routine.create({
      data: {
        dayOfWeek,
        startTime,
        duration: parseInt(duration),
        activity,
        professorSubjectId: parseInt(finalProfessorSubjectId)
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