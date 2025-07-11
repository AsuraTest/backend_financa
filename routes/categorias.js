const express = require('express');
const router = express.Router();
const db = require('../db/mysql');
const autenticarToken = require('../middleware/auth');

router.use(autenticarToken); // ✅ tudo abaixo exige login

// GET /categorias
router.get('/', async (req, res) => {
    const usuarioId = 1; // no futuro, pegue do token
  
    try {
      const [rows] = await db.query(`
        SELECT id, nome FROM categorias
        WHERE usuario_id = ? OR usuario_id IS NULL
        ORDER BY nome
      `, [usuarioId]);
  
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
  });
  

// POST /categorias
router.post('/', async (req, res) => {
    const usuarioId = 1; // futuramente pegue do token
    const { nome } = req.body;
  
    try {
      await db.query('INSERT INTO categorias (nome, usuario_id) VALUES (?, ?)', [nome, usuarioId]);
      res.status(201).json({ message: 'Categoria adicionada' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao adicionar categoria' });
    }
  });
  

module.exports = router;
