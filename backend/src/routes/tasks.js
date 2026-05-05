const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

// ============================================================================
// FUNÇÃO AUXILIAR: Parser seguro de datas
// Converte string YYYY-MM-DD para Date local (não UTC)
// ============================================================================
function parseDateAsLocal(dateString) {
  if (!dateString) return null;
  if (typeof dateString === 'object' && dateString instanceof Date) {
    return dateString;
  }
  // Se for string YYYY-MM-DD, cria Date no timezone local
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// ============================================================================
// GET: Listar tarefas de um professor-matéria
// Rota: GET /api/tasks?professorSubjectId=1
// Query params opcionais: subjectId (para compatibilidade)
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const { professorSubjectId, subjectId } = req.query;

    // Priorizar professorSubjectId, mas aceitar subjectId para compatibilidade
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
      // Isso é para compatibilidade com código antigo
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

    const tasks = await prisma.task.findMany({
      where,
      include: { evaluation: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
});

// ============================================================================
// GET: Detalhes de uma tarefa específica
// Rota: GET /api/tasks/1
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: { evaluation: true }
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    res.json(task);
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefa' });
  }
});

// ============================================================================
// POST: Criar nova tarefa
// Rota: POST /api/tasks
// Body: { "title": "Exercício 1", "type": "ATIVIDADE", "professorSubjectId": 1 }
// ============================================================================
router.post('/', async (req, res) => {
  try {
    const { title, description, type, weight, dueDate, priority, professorSubjectId, subjectId } = req.body;

    // Priorizar professorSubjectId, mas aceitar subjectId para compatibilidade
    let finalProfessorSubjectId = professorSubjectId;

    if (!finalProfessorSubjectId && !title) {
      return res.status(400).json({ 
        error: 'title é obrigatório' 
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

    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        type: type || 'ATIVIDADE',
        weight: weight || 1.0,
        dueDate: parseDateAsLocal(dueDate),
        priority: priority || 'MEDIA',
        professorSubjectId: parseInt(finalProfessorSubjectId)
      },
      include: { evaluation: true }
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
        ...(dueDate && { dueDate: parseDateAsLocal(dueDate) }),
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