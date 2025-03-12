const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

//module.exports 

const isAuthenticated = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extrai o token do cabeçalho Authorization
    if (!token) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido' });
    }

    try {
        // Verifica e decodifica o token
        const decoded = jwt.verify(token, JWT_SECRET);//process.env.JWT_SECRET);
      //  if (decoded.role !== 'admin') {
      //      return res.status(403).json({ message: 'Acesso restrito! Apenas administradores podem acessar esta área.' });
      //  }
        req.user = decoded; // Adiciona as informações do usuário ao objeto da requisição
        next(); // Continua para a próxima etapa da rota
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido' });
    }
};
module.exports = isAuthenticated;