require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const usuariosRoutes = require('./routes/usuarios');
const categoriasRoutes = require('./routes/categorias');
const transacoesRoutes = require('./routes/transacoes');

app.use('/usuarios', usuariosRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/transacoes', transacoesRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
