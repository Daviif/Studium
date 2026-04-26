const express = require('express');
const prisma = require('../prisma');
const router = express.Router();

// ============================================================================
// GET: Listar todos os professores
// Rota: GET /api/professors
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const professors = await prisma.professor.findMany({
      include: {
        subjects: {
          include: {
            subject: true
          }
        }
      }
    });

    res.json(professors);
  } catch (error) {
    console.error('Erro ao buscar professores:', error);
    res.status(500).json({ error: 'Erro ao buscar professores' });
  }
});

// ============================================================================
// GET: Detalhes de um professor específico
// Rota: GET /api/professors/1
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const professor = await prisma.professor.findUnique({
      where: { id: parseInt(id) },
      include: {
        subjects: {
          include: {
            subject: true
          }
        }
      }
    });

    if (!professor) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }

    res.json(professor);
  } catch (error) {
    console.error('Erro ao buscar professor:', error);
    res.status(500).json({ error: 'Erro ao buscar professor' });
  }
});

// ============================================================================
// POST: Criar novo professor
// Rota: POST /api/professors
// Body: { "name": "Prof. João", "email": "joao@uni.edu" }
// ============================================================================
router.post('/', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name é obrigatório' });
    }

    const professor = await prisma.professor.create({
      data: {
        name,
        email: email || null
      },
      include: {
        subjects: {
          include: {
            subject: true
          }
        }
      }
    });

    res.status(201).json(professor);
  } catch (error) {
    console.error('Erro ao criar professor:', error);
    res.status(500).json({ error: 'Erro ao criar professor' });
  }
});

// ============================================================================
// PATCH: Atualizar professor
// Rota: PATCH /api/professors/1
// Body: { "name": "Prof. João Silva", "email": "joao.silva@uni.edu" }
// ============================================================================
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const professor = await prisma.professor.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email })
      },
      include: {
        subjects: {
          include: {
            subject: true
          }
        }
      }
    });

    res.json(professor);
  } catch (error) {
    console.error('Erro ao atualizar professor:', error);
    res.status(500).json({ error: 'Erro ao atualizar professor' });
  }
});

// ============================================================================
// DELETE: Deletar professor
// Rota: DELETE /api/professors/1
// ============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.professor.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Professor deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar professor:', error);
    res.status(500).json({ error: 'Erro ao deletar professor' });
  }
});

module.exports = router;
