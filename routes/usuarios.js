const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/mysql');
const nodemailer = require('nodemailer');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

console.log("Credenciais carregadas:", {
  email: process.env.EMAIL_FROM || "NÃO ENCONTRADO",
  pass: process.env.EMAIL_PASS ? "***" : "NÃO ENCONTRADA"
});

router.post('/registro', async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
    const [existing] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hash = await bcrypt.hash(senha, 10);

    await db.query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome, email, hash]
    );

    res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no registro' });
  }
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const [users] = await db.query('SELECT id, senha_hash FROM usuarios WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const usuario = users[0];

    const match = await bcrypt.compare(senha, usuario.senha_hash);
    if (!match) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no login' });
  }
});
router.post('/recuperar-senha', async (req, res) => {
  const { email } = req.body;

 console.log(`Solicitação de recuperação recebida para: ${email}`);

  try {
    const [users] = await db.query('SELECT id, nome FROM usuarios WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'E-mail não encontrado' });
    }

    const usuario = users[0];

    const resetToken = jwt.sign({ id: usuario.id }, JWT_SECRET, { 
      expiresIn: '15m'
    });

    await db.query('UPDATE usuarios SET reset_token = ? WHERE id = ?', [resetToken, usuario.id]);

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS 
      }
    });

    const resetLink = `http://localhost:5500/redefinir-senha.html?token=${resetToken}`;
    
    const mailOptions = {
  from: `"Suporte ${process.env.APP_NAME || 'Financeiro'}" <${process.env.EMAIL_FROM}>`,
  to: email,
  subject: '🔑 Redefinição de Senha Solicitada',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h1 style="color: #2c3e50;">Redefinição de Senha</h1>
      </div>
      <div style="padding: 20px;">
        <p>Olá <strong>${usuario.nome}</strong>,</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${resetLink}" 
             style="background-color: #3498db; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
             Redefinir Senha
          </a>
        </div>
        <p><strong>Importante:</strong></p>
        <ul style="padding-left: 20px;">
          <li>Link expira em <strong>15 minutos</strong></li>
          <li>Não compartilhe este e-mail</li>
        </ul>
      </div>
    </div>
  `
};
    await transporter.sendMail(mailOptions);
    
    res.json({ message: 'Link de recuperação enviado para seu e-mail' });

  } catch (error) {
    console.error('Erro no servidor:', error);
    res.status(500).json({ error: 'Falha ao processar solicitação' });
  }
});

router.post('/redefinir-senha', async (req, res) => {
  const { token, novaSenha } = req.body;

  if (novaSenha.length < 8) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres' });
  }

  if (!token || !novaSenha) {
    return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const [users] = await db.query('SELECT id FROM usuarios WHERE id = ? AND reset_token = ?', 
      [decoded.id, token]);
    
    if (users.length === 0) {
      return res.status(400).json({ error: 'Token inválido ou já utilizado' });
    }

    const hash = await bcrypt.hash(novaSenha, 10);
    
    // Atualiza a senha e remove o token
    await db.query(
      'UPDATE usuarios SET senha_hash = ?, reset_token = NULL WHERE id = ?',
      [hash, decoded.id]
    );

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error(error);
    if (error.name === 'TokenExpiredError') {
      res.status(400).json({ error: 'Token expirado' });
    } else {
      res.status(400).json({ error: 'Token inválido' });
    }
  }
});

module.exports = router;