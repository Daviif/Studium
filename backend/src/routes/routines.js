const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

// ============================================================================
// GET: Listar TODAS as rotinas do usuário autenticado (para calendários)
// Rota: GET /api/routines/all/user
// Retorna rotinas de todas as matérias do usuário
// ============================================================================
router.get('/all/user', async (req, res) => {
  try {
    const userId = req.userId; // Do middleware de autenticação

    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Busca todas as rotinas do usuário (através dos cursos)
    const routines = await prisma.routine.findMany({
      where: {
        professorSubject: {
          subject: {
            course: {
              userId: userId
            }
          }
        }
      },
      include: {
        professorSubject: {
          include: {
            subject: { select: { id: true, name: true } },
            professor: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { dayOfWeek: 'asc' }
    });

    // Enriquecer com informações adicionais
    const enrichedRoutines = routines.map(routine => ({
      ...routine,
      subjectName: routine.professorSubject.subject.name,
      professorName: routine.professorSubject.professor.name
    }));

    res.json(enrichedRoutines);
  } catch (error) {
    console.error('Erro ao buscar rotinas do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar rotinas' });
  }
});

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
// PATCH: Atualizar rotina
// Rota: PATCH /api/routines/1
// ============================================================================
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, startTime, duration, activity } = req.body;

    const existing = await prisma.routine.findFirst({
      where: {
        id: parseInt(id),
        professorSubject: { subject: { course: { userId: req.userId } } }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Rotina não encontrada' });
    }

    const routine = await prisma.routine.update({
      where: { id: parseInt(id) },
      data: {
        ...(dayOfWeek && { dayOfWeek }),
        ...(startTime && { startTime }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(activity && { activity })
      }
    });

    res.json(routine);
  } catch (error) {
    console.error('Erro ao atualizar rotina:', error);
    res.status(500).json({ error: 'Erro ao atualizar rotina' });
  }
});

// ============================================================================
// DELETE: Deletar rotina
// Rota: DELETE /api/routines/1
// ============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.routine.findFirst({
      where: {
        id: parseInt(id),
        professorSubject: { subject: { course: { userId: req.userId } } }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Rotina não encontrada' });
    }

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