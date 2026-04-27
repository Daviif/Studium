const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const prisma = require('../prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta';
const JWT_EXPIRES_IN = '7d'; // Token válido por 7 dias

// ============================================================================
// POST: Registrar novo usuário
// Rota: POST /api/auth/register
// Body: { "email": "user@example.com", "password": "123456", "name": "João" }
// ============================================================================
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e password são obrigatórios' 
      });
    }

    // Verifica se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria usuário
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0] // Usa parte do email como nome
      }
    });

    // Gera JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Erro ao registrar:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// ============================================================================
// POST: Login
// Rota: POST /api/auth/login
// Body: { "email": "user@example.com", "password": "123456" }
// ============================================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e password são obrigatórios' 
      });
    }

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Compara senhas
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Gera JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// ============================================================================
// GET: Perfil do usuário (requer autenticação)
// Rota: GET /api/auth/profile
// Headers: Authorization: Bearer <token>
// ============================================================================
router.get('/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      user
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// ============================================================================
// PATCH: Atualizar perfil do usuário (requer autenticação)
// Rota: PATCH /api/auth/profile
// Headers: Authorization: Bearer <token>
// Body: { "name": "Novo Nome" }
// ============================================================================
router.patch('/profile', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome não pode estar vazio' });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name: name.trim()
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    res.json({
      message: 'Perfil atualizado com sucesso',
      user
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// ============================================================================
// POST: Mudar senha do usuário (requer autenticação)
// Rota: POST /api/auth/change-password
// Headers: Authorization: Bearer <token>
// Body: { "currentPassword": "123456", "newPassword": "nova123456" }
// ============================================================================
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Senha atual e nova senha são obrigatórias' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Nova senha deve ter no mínimo 6 caracteres' 
      });
    }

    // Busca usuário
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Compara senhas
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualiza senha
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        password: hashedPassword
      }
    });

    res.json({
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});

module.exports = router;