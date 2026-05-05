const express = require('express');
const prisma = require('../prisma');
const DEFAULT_COURSES = require('../constants/defaultCourses');
const router = express.Router();

// ============================================================================
// GET: Listar todos os cursos do usuário autenticado
// Rota: GET /api/courses
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const userId = req.userId; // Vem do middleware de autenticação

    const courses = await prisma.course.findMany({
      where: { userId },
      include: {
        subjects: {
          include: {
            professorSubjects: {
              include: {
                professor: true,
                tasks: true
              }
            }
          }
        }
      }
    });

    res.json(courses);
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    res.status(500).json({ error: 'Erro ao buscar cursos' });
  }
});

// ============================================================================
// GET: Buscar um curso específico com suas matérias e tarefas
// Rota: GET /api/courses/1
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: {
        subjects: {
          include: {
            professorSubjects: {
              include: {
                professor: true,
                tasks: true,
                routines: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    res.json(course);
  } catch (error) {
    console.error('Erro ao buscar curso:', error);
    res.status(500).json({ error: 'Erro ao buscar curso' });
  }
});

// ============================================================================
// POST: Criar curso padrão com suas matérias obrigatórias
// Rota: POST /api/courses/default/:courseId
// Params: courseId = eng-comp, sist-info, eng-eletrica, eng-producao
// ============================================================================
router.post('/default/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    // Validar se o ID do curso existe
    if (!DEFAULT_COURSES[courseId]) {
      return res.status(400).json({
        error: 'Curso padrão não encontrado. IDs válidos: eng-comp, sist-info, eng-eletrica, eng-producao'
      });
    }

    const courseData = DEFAULT_COURSES[courseId];

    // Criar o curso
    const course = await prisma.course.create({
      data: {
        name: courseData.name,
        university: 'Padrão',
        userId,
        subjects: {
          create: courseData.subjects.map(subject => ({
            name: subject.name,
            period: subject.period,
            type: subject.type
          }))
        }
      },
      include: {
        subjects: true
      }
    });

    res.status(201).json({
      ...course,
      message: `Curso '${course.name}' criado com ${course.subjects.length} matérias obrigatórias!`
    });
  } catch (error) {
    console.error('Erro ao criar curso padrão:', error);
    res.status(500).json({ error: 'Erro ao criar curso padrão' });
  }
});

// ============================================================================
// POST: Criar novo curso
// Rota: POST /api/courses
// Body: { "name": "Engenharia", "university": "USP" }
// ============================================================================
router.post('/', async (req, res) => {
  try {
    const { name, university } = req.body;
    const userId = req.userId; // Vem do middleware de autenticação

    if (!name || !university) {
      return res.status(400).json({
        error: 'name e university são obrigatórios'
      });
    }

    const course = await prisma.course.create({
      data: {
        name,
        university,
        userId
      }
    });

    res.status(201).json(course);
  } catch (error) {
    console.error('Erro ao criar curso:', error);
    res.status(500).json({ error: 'Erro ao criar curso' });
  }
});

// ============================================================================
// PATCH: Atualizar curso
// Rota: PATCH /api/courses/1
// Body: { "name": "Novo nome", "university": "Nova uni" }
// ============================================================================
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, university } = req.body;

    const course = await prisma.course.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(university && { university })
      }
    });

    res.json(course);
  } catch (error) {
    console.error('Erro ao atualizar curso:', error);
    res.status(500).json({ error: 'Erro ao atualizar curso' });
  }
});

// ============================================================================
// DELETE: Deletar curso (deleta também todas as matérias e tarefas)
// Rota: DELETE /api/courses/1
// ============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.course.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Curso deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar curso:', error);
    res.status(500).json({ error: 'Erro ao deletar curso' });
  }
});

module.exports = router;