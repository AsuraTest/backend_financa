const express = require('express');
const router = express.Router();
const db = require('../db/mysql');
const autenticarToken = require('../middleware/auth');

router.use(autenticarToken);

// DELETE /transacoes/:id
router.delete('/:id', async (req, res) => {
  const usuarioId = req.usuarioId;
  const transacaoId = req.params.id;
  try {
    // Garante que só o dono pode excluir
    const [result] = await db.query('DELETE FROM transacoes WHERE id = ? AND usuario_id = ?', [transacaoId, usuarioId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transação não encontrada ou não pertence ao usuário' });
    }
    res.json({ message: 'Transação excluída com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir transação' });
  }
});

router.put('/:id', async (req, res) => {
  const usuarioId = req.usuarioId;
  const transacaoId = req.params.id;
  const { tipo, descricao, valor, categoria_id, data } = req.body;
  try {
    // Garante que só o dono pode editar
    const [result] = await db.query(
      'UPDATE transacoes SET tipo = ?, descricao = ?, valor = ?, categoria_id = ?, data = ? WHERE id = ? AND usuario_id = ?',
      [tipo, descricao, valor, categoria_id, data, transacaoId, usuarioId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transação não encontrada ou não pertence ao usuário' });
    }
    res.json({ message: 'Transação atualizada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Preencha todos os campos' });
  }
});

// GET /transacoes
router.get('/', async (req, res) => {
  const usuarioId = req.usuarioId; 

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
  const usuarioId = req.usuarioId; 
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
