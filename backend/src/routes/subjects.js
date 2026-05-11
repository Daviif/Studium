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
        professorSubjects: {
          include: {
            professor: true
          }
        }
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
        professorSubjects: {
          include: {
            professor: true,
            tasks: true,
            routines: true,
            files: true
          }
        }
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
    const { professorSubjectId } = req.query;

    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(id) },
      include: { 
        professorSubjects: {
          include: { tasks: true }
        }
      }
    });

    if (!subject) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    // ========================================================================
    // 🧠 CÁLCULO DO PROGRESSO (Lógica do Backend)
    // ========================================================================
    
    // Se especificou um professorSubjectId, calcula progresso apenas para esse professor
    if (professorSubjectId) {
      const professorSubject = subject.professorSubjects.find(
        ps => ps.id === parseInt(professorSubjectId)
      );

      if (!professorSubject) {
        return res.status(404).json({ error: 'Professor-Matéria não encontrado' });
      }

      const tasks = professorSubject.tasks;
      
      if (tasks.length === 0) {
        return res.json({
          professorSubjectId: professorSubject.id,
          professor: professorSubject.professor.name,
          semestre: professorSubject.semestre,
          progress: 0,
          totalTasks: 0,
          completedTasks: 0
        });
      }

      const totalWeight = tasks.reduce((sum, task) => sum + task.weight, 0);
      const completedWeight = tasks
        .filter(task => task.completed)
        .reduce((sum, task) => sum + task.weight, 0);

      const progress = Math.round((completedWeight / totalWeight) * 100);

      return res.json({
        professorSubjectId: professorSubject.id,
        professor: professorSubject.professor.name,
        semestre: professorSubject.semestre,
        progress,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        totalWeight: parseFloat(totalWeight.toFixed(2)),
        completedWeight: parseFloat(completedWeight.toFixed(2))
      });
    }

    // Se não especificou professorSubjectId, calcula progresso para todos os professors
    const progressByProfessor = subject.professorSubjects.map(professorSubject => {
      const tasks = professorSubject.tasks;
      
      if (tasks.length === 0) {
        return {
          professorSubjectId: professorSubject.id,
          professor: professorSubject.professor.name,
          semestre: professorSubject.semestre,
          progress: 0,
          totalTasks: 0,
          completedTasks: 0
        };
      }

      const totalWeight = tasks.reduce((sum, task) => sum + task.weight, 0);
      const completedWeight = tasks
        .filter(task => task.completed)
        .reduce((sum, task) => sum + task.weight, 0);

      const progress = Math.round((completedWeight / totalWeight) * 100);

      return {
        professorSubjectId: professorSubject.id,
        professor: professorSubject.professor.name,
        semestre: professorSubject.semestre,
        progress,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        totalWeight: parseFloat(totalWeight.toFixed(2)),
        completedWeight: parseFloat(completedWeight.toFixed(2))
      };
    });

    res.json({
      subjectId: subject.id,
      subjectName: subject.name,
      progressByProfessor
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
      },
      include: {
        professorSubjects: {
          include: {
            professor: true
          }
        }
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
    const { name, description, period } = req.body;

    const existing = await prisma.subject.findFirst({
      where: { id: parseInt(id), course: { userId: req.userId } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    const subject = await prisma.subject.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(period !== undefined && { period })
      },
      include: {
        professorSubjects: {
          include: {
            professor: true
          }
        }
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

    const existing = await prisma.subject.findFirst({
      where: { id: parseInt(id), course: { userId: req.userId } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    await prisma.subject.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Matéria deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar matéria:', error);
    res.status(500).json({ error: 'Erro ao deletar matéria' });
  }
});

// ============================================================================
// GET: Listar professores de uma matéria
// Rota: GET /api/subjects/1/professors
// ============================================================================
router.get('/:id/professors', async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(id) },
      include: {
        professorSubjects: {
          include: {
            professor: true
          }
        }
      }
    });

    if (!subject) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    res.json(subject.professorSubjects);
  } catch (error) {
    console.error('Erro ao buscar professores da matéria:', error);
    res.status(500).json({ error: 'Erro ao buscar professores da matéria' });
  }
});

// ============================================================================
// POST: Associar um professor a uma matéria
// Rota: POST /api/subjects/1/professors
// Body: { "professorId": 1, "semestre": "2025/1" }
// ============================================================================
router.post('/:id/professors', async (req, res) => {
  try {
    const { id } = req.params;
    const { professorId, semestre } = req.body;

    if (!professorId || !semestre) {
      return res.status(400).json({ 
        error: 'professorId e semestre são obrigatórios' 
      });
    }

    // Verificar se a matéria existe
    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(id) }
    });

    if (!subject) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    // Verificar se o professor existe
    const professor = await prisma.professor.findUnique({
      where: { id: parseInt(professorId) }
    });

    if (!professor) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }

    // Criar a associação
    const professorSubject = await prisma.professorSubject.create({
      data: {
        professorId: parseInt(professorId),
        subjectId: parseInt(id),
        semestre
      },
      include: {
        professor: true
      }
    });

    res.status(201).json(professorSubject);
  } catch (error) {
    // Erro de constraint unique (professor+subject+semestre duplicado)
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Este professor já leciona esta matéria neste semestre' 
      });
    }
    console.error('Erro ao associar professor:', error);
    res.status(500).json({ error: 'Erro ao associar professor' });
  }
});

// ============================================================================
// DELETE: Remover um professor de uma matéria
// Rota: DELETE /api/subjects/1/professors/5
// ============================================================================
router.delete('/:id/professors/:professorSubjectId', async (req, res) => {
  try {
    const { id, professorSubjectId } = req.params;

    // Verificar se a associação existe e pertence à matéria correta
    const professorSubject = await prisma.professorSubject.findUnique({
      where: { id: parseInt(professorSubjectId) }
    });

    if (!professorSubject || professorSubject.subjectId !== parseInt(id)) {
      return res.status(404).json({ error: 'Associação não encontrada' });
    }

    await prisma.professorSubject.delete({
      where: { id: parseInt(professorSubjectId) }
    });

    res.json({ message: 'Professor removido da matéria com sucesso' });
  } catch (error) {
    console.error('Erro ao remover professor:', error);
    res.status(500).json({ error: 'Erro ao remover professor' });
  }
});

// ============================================================================
// POST: Classificar matérias automaticamente pelo período atual do aluno
// Rota: POST /api/subjects/bulk-classify
// Body: { courseId, currentPeriod: 5, semester: "2026/1" }
// ============================================================================
router.post('/bulk-classify', async (req, res) => {
  try {
    const { courseId, currentPeriod, semester } = req.body;

    if (!courseId || !currentPeriod) {
      return res.status(400).json({ error: 'courseId e currentPeriod são obrigatórios' });
    }

    const course = await prisma.course.findFirst({
      where: { id: parseInt(courseId), userId: req.userId }
    });

    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    const subjects = await prisma.subject.findMany({
      where: { courseId: parseInt(courseId) }
    });

    const classified = [];

    for (const subject of subjects) {
      const period = parseInt(subject.period);
      const current = parseInt(currentPeriod);

      // Só classifica matérias obrigatórias com período definido
      if (subject.type !== 'OBRIGATORIA' || !subject.period || isNaN(period)) continue;

      let newStatus;
      if (period < current) {
        newStatus = 'APROVADA';
      } else if (period === current) {
        newStatus = 'ATIVA';
      } else {
        newStatus = 'PENDENTE';
      }

      if (subject.status !== newStatus) {
        await prisma.subject.update({ where: { id: subject.id }, data: { status: newStatus } });
        await prisma.subjectStatusHistory.create({
          data: {
            subjectId: subject.id,
            status: newStatus,
            semester: semester || null,
            note: 'Classificação automática por período'
          }
        });
        classified.push({ subjectId: subject.id, name: subject.name, status: newStatus });
      }
    }

    res.json({ classified, count: classified.length });
  } catch (error) {
    console.error('Erro ao classificar matérias:', error);
    res.status(500).json({ error: 'Erro ao classificar matérias' });
  }
});

// ============================================================================
// PATCH: Alterar status de uma matéria
// Rota: PATCH /api/subjects/:id/status
// Body: { status: "ATIVA", semester?: "2026/1", note?: "Matriculado no sistema" }
// ============================================================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, semester, note } = req.body;

    const validStatuses = ['APROVADA', 'ATIVA', 'TRANCADA', 'REPROVADA', 'PENDENTE', 'DISPENSADA'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status inválido. Use: ${validStatuses.join(', ')}` });
    }

    const existing = await prisma.subject.findFirst({
      where: { id: parseInt(id), course: { userId: req.userId } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    const [updated] = await prisma.$transaction([
      prisma.subject.update({
        where: { id: parseInt(id) },
        data: { status }
      }),
      prisma.subjectStatusHistory.create({
        data: {
          subjectId: parseInt(id),
          status,
          semester: semester || null,
          note: note || null
        }
      })
    ]);

    res.json(updated);
  } catch (error) {
    console.error('Erro ao alterar status:', error);
    res.status(500).json({ error: 'Erro ao alterar status' });
  }
});

// ============================================================================
// GET: Histórico de status de uma matéria
// Rota: GET /api/subjects/:id/history
// ============================================================================
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.subject.findFirst({
      where: { id: parseInt(id), course: { userId: req.userId } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    const history = await prisma.subjectStatusHistory.findMany({
      where: { subjectId: parseInt(id) },
      orderBy: { createdAt: 'desc' }
    });

    res.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de status' });
  }
});

module.exports = router;