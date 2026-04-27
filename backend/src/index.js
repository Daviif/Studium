const express = require('express');
const cors = require('cors');
require('dotenv').config();
const prisma = require('./prisma');

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use(cors());
app.use(express.json());

// ============================================================================
// ROTAS
// ============================================================================

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend está funcionando' });
});

// IMPORTAR ROTAS
const coursesRouter = require('./routes/courses');
const subjectsRouter = require('./routes/subjects');
const tasksRouter = require('./routes/tasks');
const routinesRouter = require('./routes/routines');
const filesRouter = require('./routes/files');
const authRouter = require('./routes/auth');
const professorsRouter = require('./routes/professors');
const path = require('path');
const { startJobs } = require('./jobs');

startJobs();

// MIDDLEWARE DE AUTENTICAÇÃO
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta';

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Erro na verificação do token:', err.message);
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  });
};

// Servir arquivos estaticamente
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ROTAS PÚBLICAS
app.use('/api/auth', authRouter);

// ROTAS PROTEGIDAS
app.use('/api/courses', authenticateToken, coursesRouter);
app.use('/api/subjects', authenticateToken, subjectsRouter);
app.use('/api/tasks', authenticateToken, tasksRouter);
app.use('/api/routines', authenticateToken, routinesRouter);
app.use('/api/files', authenticateToken, filesRouter);
app.use('/api/professors', authenticateToken, professorsRouter);
app.use('/api/notifications', authenticateToken, require('./routes/notifications'));
// ============================================================================
// INICIAR SERVIDOR
// ============================================================================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

// ============================================================================
// TRATAMENTO DE ERROS GLOBAL
// ============================================================================
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.message);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Desconectado do banco');
  process.exit(0);
});