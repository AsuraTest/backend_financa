const jwt = require('jsonwebtoken');

const JWT_SECRET = 'seu_segredo_super_secreto'; // ideal guardar em .env

function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Token no formato: Bearer <token>
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }

    // Guarda o ID do usuário decodificado no request
    req.usuarioId = user.id;
    next();
  });
}

module.exports = autenticarToken;
