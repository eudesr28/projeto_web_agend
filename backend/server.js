require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB conectado'))
  .catch((err) => console.error('Erro na conexão com MongoDB:', err));

// Middleware
app.use(express.json());
app.use('/api/user', userRoutes);


// Servir arquivos estáticos (Frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
