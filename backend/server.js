require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const path = require('path');
const session = require('express-session');

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

// Middleware de Sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'seu-segredo', // Defina um segredo para a sessão
  resave: false, // Não resave a sessão se não for modificada
  saveUninitialized: true, // Salve a sessão mesmo que não tenha sido modificada
  cookie: {
    secure: true,//process.env.NODE_ENV === 'production', // Habilita o cookie seguro apenas em produção (HTTPS)
    httpOnly: true, // Impede o acesso ao cookie via JavaScript
    maxAge: 3600000, // Tempo de vida do cookie (1 hora)
    sameSite: 'None', // Permite cookies cross-origin, necessário para CORS
  },
}));

app.use('/api/user', userRoutes);


// Servir arquivos estáticos (Frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
