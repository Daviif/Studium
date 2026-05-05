const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Pega token do header Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Verifica token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adiciona dados do usuário ao request
    req.userId = decoded.id;
    req.userEmail = decoded.email;

    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error.message);
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

module.exports = authMiddleware;