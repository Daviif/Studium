const express = require('express');
const multer = require('multer');
const prisma = require('../prisma');
const { parseEnrollmentPDF, normalizeName } = require('../services/enrollmentParser');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são aceitos'));
    }
  }
});

// ============================================================================
// POST /api/enrollment/debug  (temporário — ver texto bruto extraído do PDF)
// ============================================================================
router.post('/debug', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'PDF obrigatório' });
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(req.file.buffer);
    res.json({ text: data.text, length: data.text.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// POST /api/enrollment/parse
// Recebe PDF, extrai matérias e horários, faz matching com o curso
// Body: multipart/form-data { pdf: File, courseId: number }
// ============================================================================
router.post('/parse', upload.single('pdf'), async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!req.file) return res.status(400).json({ error: 'Arquivo PDF é obrigatório' });
    if (!courseId) return res.status(400).json({ error: 'courseId é obrigatório' });

    // Verifica propriedade do curso
    const course = await prisma.course.findFirst({
      where: { id: parseInt(courseId), userId: req.userId },
      include: { subjects: true }
    });

    if (!course) return res.status(404).json({ error: 'Curso não encontrado' });

    // Extrai dados do PDF (regex + Claude)
    const parsed = await parseEnrollmentPDF(req.file.buffer);

    if (parsed.subjects.length === 0) {
      return res.status(422).json({
        error: 'Nenhuma matéria encontrada no PDF. Verifique se é um atestado de matrícula válido da UFOP.'
      });
    }

    // Matching: encontra matérias existentes ou marca para criação
    const subjects = parsed.subjects.map(pdfSubject => {
      const normalizedPdf = normalizeName(pdfSubject.name);
      const courseSubject = course.subjects.find(s =>
        normalizeName(s.name) === normalizedPdf
      );

      return courseSubject
        ? { ...pdfSubject, subjectId: courseSubject.id, subjectName: courseSubject.name, currentStatus: courseSubject.status, willCreate: false }
        : { ...pdfSubject, subjectId: null, subjectName: pdfSubject.name, currentStatus: null, willCreate: true };
    });

    res.json({
      semester: parsed.semester,
      studentName: parsed.studentName,
      subjects,
      courseId: parseInt(courseId)
    });
  } catch (err) {
    console.error('Erro ao parsear atestado:', err);
    res.status(500).json({ error: 'Erro ao analisar o PDF. Verifique se é um atestado de matrícula válido.' });
  }
});

// ============================================================================
// POST /api/enrollment/apply
// Marca matérias como ATIVA e (opcionalmente) gera rotinas de aula
// Body: { courseId, semester, subjects: [{subjectId, schedule}], generateRoutines }
// ============================================================================
router.post('/apply', async (req, res) => {
  try {
    const { courseId, semester, subjects, generateRoutines } = req.body;

    if (!courseId || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'courseId e subjects são obrigatórios' });
    }

    const course = await prisma.course.findFirst({
      where: { id: parseInt(courseId), userId: req.userId }
    });
    if (!course) return res.status(404).json({ error: 'Curso não encontrado' });

    let statusUpdated = 0;
    let routinesCreated = 0;

    let subjectsCreated = 0;

    for (const item of subjects) {
      let subjectId = item.subjectId;

      // Cria a matéria se ainda não existir no curso
      if (!subjectId && item.willCreate && item.subjectName) {
        const created = await prisma.subject.create({
          data: {
            name: item.subjectName,
            courseId: parseInt(courseId),
            status: 'ATIVA'
          }
        });
        subjectId = created.id;
        subjectsCreated++;

        await prisma.subjectStatusHistory.create({
          data: {
            subjectId,
            status: 'ATIVA',
            semester: semester || null,
            note: 'Criada e importada do atestado de matrícula'
          }
        });
        statusUpdated++;
        // Rotinas para matérias recém-criadas requerem professor — pula
        continue;
      }

      if (!subjectId) continue;

      // Verifica propriedade
      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, courseId: parseInt(courseId) }
      });
      if (!subject) continue;

      // Marca como ATIVA + registra histórico
      await prisma.subject.update({ where: { id: subjectId }, data: { status: 'ATIVA' } });
      await prisma.subjectStatusHistory.create({
        data: {
          subjectId,
          status: 'ATIVA',
          semester: semester || null,
          note: 'Importado do atestado de matrícula'
        }
      });
      statusUpdated++;

      // Gera rotinas se solicitado e houver schedule disponível
      if (generateRoutines && Array.isArray(item.schedule) && item.schedule.length > 0) {
        const professorSubject = await prisma.professorSubject.findFirst({
          where: { subjectId: item.subjectId },
          orderBy: { createdAt: 'desc' },
          include: { subject: { select: { name: true } } }
        });

        if (professorSubject) {
          for (const slot of item.schedule) {
            await prisma.routine.create({
              data: {
                dayOfWeek: slot.day,
                startTime: slot.startTime,
                duration: slot.duration || 100,
                activity: `Aula de ${professorSubject.subject.name}`,
                professorSubjectId: professorSubject.id
              }
            });
            routinesCreated++;
          }
        }
      }
    }

    res.json({ statusUpdated, routinesCreated, subjectsCreated });
  } catch (err) {
    console.error('Erro ao aplicar atestado:', err);
    res.status(500).json({ error: 'Erro ao aplicar dados do atestado' });
  }
});

module.exports = router;
