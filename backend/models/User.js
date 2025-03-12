const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Definição do esquema de usuário
const userSchema = new mongoose.Schema({
    nome: String,
    cpf: { type: String, unique: true },
    nascimento: Date,
    email: String,
    senha: String,
    role: { type: String, default: 'user' }, // Valor padrão para usuários comuns
});

// Middleware para hashear a senha antes de salvar
userSchema.pre('save', async function (next) {
    if (!this.isModified('senha')) return next();
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
});

// Método para comparar senhas
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.senha);
};

// Exportação do modelo
module.exports = mongoose.model('User', userSchema);
