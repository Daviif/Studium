const express = require('express');
const upload = require('../middleware/upload');
const router = express.Router();
const prisma = require('../prisma');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');


if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.error('❌ ERRO: CLOUDINARY_CLOUD_NAME não está definido!');
  console.error('   Verifique se .env existe e tem esta variável');
}
if (!process.env.CLOUDINARY_API_KEY) {
  console.error('❌ ERRO: CLOUDINARY_API_KEY não está definido!');
}
if (!process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ ERRO: CLOUDINARY_API_SECRET não está definido!');
}

console.log('✅ Variáveis carregadas:');
console.log('  CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('  API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('  API_SECRET:', process.env.CLOUDINARY_API_SECRET?.substring(0, 10) + '...');


// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

    // Verifica se professorSubject existe
    const professorSubject = await prisma.professorSubject.findUnique({
      where: { id: parseInt(finalProfessorSubjectId) }
    });

    if (!professorSubject) {
      return res.status(404).json({ error: 'Professor-Matéria não encontrado' });
    }

    // Define o nome: customName se fornecido, caso contrário usa o original
    const displayName = customName && customName.trim() ? customName.trim() : req.file.originalname;

    // Upload manual para Cloudinary usando o buffer do arquivo
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: process.env.CLOUDINARY_FOLDER || 'studyhub_files',
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Converter buffer em stream e enviar para Cloudinary
      Readable.from(req.file.buffer).pipe(stream);
    });

    const fileUrl = uploadResult.secure_url;
    const cloudinaryId = uploadResult.public_id;

    // Salva arquivo no banco de dados
    const file = await prisma.file.create({
      data: {
        name: displayName,
        url: fileUrl,
        mimeType: req.file.mimetype,
        size: req.file.size,
        cloudinaryId: cloudinaryId, // ID do arquivo no Cloudinary para deletar depois
        professorSubjectId: parseInt(finalProfessorSubjectId)
      }
    });

    res.status(201).json({
      message: 'Arquivo enviado com sucesso',
      file: {
        id: file.id,
        name: file.name,
        size: file.size,
        url: file.url,
        uploadedAt: file.uploadedAt
      }
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload: ' + error.message });
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
// GET: Download/Redirect para arquivo no Cloudinary
// Rota: GET /api/files/download/:id
// ============================================================================
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id: parseInt(id) }
    });

    if (!file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Redireciona para a URL do Cloudinary
    res.redirect(file.url);
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    res.status(500).json({ error: 'Erro ao fazer download' });
  }
});

// ============================================================================
// DELETE: Deletar arquivo (Cloudinary + Database)
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

    // Deleta do Cloudinary usando o cloudinaryId
    if (file.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(file.cloudinaryId);
        console.log(`✅ Arquivo deletado do Cloudinary: ${file.cloudinaryId}`);
      } catch (cloudinaryError) {
        console.warn(`⚠️ Erro ao deletar do Cloudinary: ${cloudinaryError.message}`);
        // Continua mesmo se falhar no Cloudinary
      }
    }

    // Deleta do banco
    await prisma.file.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Arquivo deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    res.status(500).json({ error: 'Erro ao deletar arquivo: ' + error.message });
  }
});

module.exports = router;