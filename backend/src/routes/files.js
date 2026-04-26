const express = require('express');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const prisma = require('../prisma');

// ============================================================================
// POST: Fazer upload de arquivo
// Rota: POST /api/files/upload
// FormData: { "file": <arquivo>, "professorSubjectId": 1 }
// ============================================================================
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const { professorSubjectId, subjectId, customName } = req.body;

    // Priorizar professorSubjectId
    let finalProfessorSubjectId = professorSubjectId;

    if (!finalProfessorSubjectId && subjectId) {
      // Se fornecido apenas subjectId, buscar o primeiro professorSubject
      const professorSubject = await prisma.professorSubject.findFirst({
        where: { subjectId: parseInt(subjectId) }
      });

      if (!professorSubject) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          error: 'Nenhum professor encontrado para esta matéria. Use professorSubjectId.' 
        });
      }

      finalProfessorSubjectId = professorSubject.id;
    }

    if (!finalProfessorSubjectId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'professorSubjectId é obrigatório' 
      });
    }

    // Verifica se professorSubject existe
    const professorSubject = await prisma.professorSubject.findUnique({
      where: { id: parseInt(finalProfessorSubjectId) }
    });

    if (!professorSubject) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Professor-Matéria não encontrado' });
    }

    // Define o nome: customName se fornecido, caso contrário usa o original
    const displayName = customName && customName.trim() ? customName.trim() : req.file.originalname;

    // Salva arquivo no banco de dados
    const file = await prisma.file.create({
      data: {
        filename: req.file.filename,
        originalName: displayName,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url: `/api/files/download/${req.file.filename}`,
        professorSubjectId: parseInt(finalProfessorSubjectId)
      }
    });

    res.status(201).json({
      message: 'Arquivo enviado com sucesso',
      file: {
        id: file.id,
        filename: file.originalName,
        size: file.size,
        url: file.url,
        uploadedAt: file.uploadedAt
      }
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Erro ao fazer upload' });
  }
});

// ============================================================================
// GET: Listar arquivos de um professor-matéria
// Rota: GET /api/files?professorSubjectId=1
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

    const files = await prisma.file.findMany({
      where,
      orderBy: { uploadedAt: 'desc' }
    });

    res.json(files);
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    res.status(500).json({ error: 'Erro ao listar arquivos' });
  }
});

// ============================================================================
// GET: Download de arquivo
// Rota: GET /api/files/download/:filename
// ============================================================================
router.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(__dirname, '../uploads', filename);

    // Segurança: previne path traversal
    if (!filepath.startsWith(path.join(__dirname, '../uploads'))) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    res.download(filepath);
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    res.status(500).json({ error: 'Erro ao fazer download' });
  }
});

// ============================================================================
// DELETE: Deletar arquivo
// Rota: DELETE /api/files/:id
// ============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id: parseInt(id) }
    });

    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Deleta do disco
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Deleta do banco
    await prisma.file.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Arquivo deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    res.status(500).json({ error: 'Erro ao deletar arquivo' });
  }
});

module.exports = router;