const express = require('express');
const router = express.Router();
const db = require('../db/mysql');
const autenticarToken = require('../middleware/auth');

router.use(autenticarToken); // ✅ tudo abaixo exige login

// GET /transacoes
router.get('/', async (req, res) => {
  const usuarioId = 1; // futuramente pegue do token ou sessão

  try {
    const [rows] = await db.query(`
      SELECT t.id, t.tipo, t.descricao, t.valor, DATE_FORMAT(t.data, '%d/%m/%Y') AS data, c.nome AS categoria
      FROM transacoes t
      LEFT JOIN categorias c ON t.categoria_id = c.id
      WHERE t.usuario_id = ?
      ORDER BY t.data DESC
    `, [usuarioId]);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

// POST /transacoes
router.post('/', async (req, res) => {
  const usuarioId = 1; // futuramente pegue do token ou sessão
  const { tipo, descricao, valor, categoria_id } = req.body;

  try {
    await db.query(
      'INSERT INTO transacoes (tipo, descricao, valor, categoria_id, usuario_id) VALUES (?, ?, ?, ?, ?)',
      [tipo, descricao, valor, categoria_id, usuarioId]
    );

    res.status(201).json({ message: 'Transação adicionada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao adicionar transação' });
  }
});

module.exports = router;
