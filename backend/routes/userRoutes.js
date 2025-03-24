const express = require('express');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const Agendamento = require('../models/Agendamento');
const jwt = require('jsonwebtoken');
const isAuthenticated = require('../middleware/auth'); // Middleware de autorização para admin
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Criar usuário
router.post('/', [
    check('cpf').isLength({ min: 11, max: 11 }).withMessage('CPF inválido'),
    check('email').isEmail().withMessage('Email inválido'),
    check('senha').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)
        .withMessage('A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, letras minúsculas, números e caractere especial(!@#$%^&*(),.?":{}|<>)')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nome, cpf, nascimento, email, senha } = req.body;

    try {
        const userExists = await User.findOne({ cpf });
        if (userExists) {
            return res.status(400).json({ message: 'Usuário já cadastrado' });
        }

        const user = new User({ nome, cpf, nascimento, email, senha });
        await user.save();
        res.status(201).json({ message: 'Usuário criado com sucesso' });
    } catch (err) {
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// Login usuário
router.post('/login', async (req, res) => {
    const { cpf, senha } = req.body;

    if (!cpf || !senha) {
        return res.status(400).json({ message: 'CPF e senha são obrigatórios' });
    }
    try {
        const user = await User.findOne({ cpf });
        if (!user) {
            return res.status(400).json({ message: 'Usuário não encontrado ou Senha incorreta' });
        }
        const isMatch = await user.matchPassword(senha);
        if (!isMatch) {
            return res.status(400).json({ message: 'Usuário não encontrado ou Senha incorreta' });
        }
        // Gerar token JWT com o role e userId
        const token = jwt.sign(
            { userId: user._id, role: user.role }, 
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({ token, role: user.role });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// Listar usuários (apenas admin)
router.get('/users', isAuthenticated, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso restrito' });
    }
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao obter usuários' });
    }
});

// Buscar usuário pelo ID (apenas admin)
router.get('/usuarioid/:id', isAuthenticated, async (req, res) => {
    if (req.user.role !== 'admin'  && req.user.userId !== req.params.id ) {
        return res.status(403).json({ message: 'Acesso restrito' });
    }
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar usuário' });
    }
});

// Atualizar todos os cadastros (apenas admin)
router.put('/usuarioedit/:id', isAuthenticated, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.userId !== req.params.id) {
        return res.status(403).json({ message: 'Acesso restrito' });
    }
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) {
           return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao atualizar usuário' });
    }
});

// Excluir usuário (apenas admin)
router.delete('/userdelete/:userId', isAuthenticated, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso restrito' });
    }
    try {
        // Excluir todos os agendamentos do usuário
        await Agendamento.deleteMany({ userId: req.params.userId });
            
        const user = await User.findByIdAndDelete(req.params.userId);
            if (!user) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }
            res.json({ message: 'Usuário removido com sucesso' });
        } catch (err) {
        res.status(500).json({ message: 'Erro ao remover usuário' });
    }
});

// Criar agendamento (apenas usuários cadastrados)
router.post('/agendamentocriar/:userId', isAuthenticated, async (req, res) => {
    const { data, horario } = req.body;
    const userId = req.params.userId;

    try {

        // Verificar se o usuário já tem agendamento
        const existingAgendamento = await Agendamento.findOne({ userId });
        if (existingAgendamento) {
            return res.status(400).json({ message: 'Você já tem um agendamento.' });
        }

        // Verificar se o horário já está agendado
        const agendamentoExistente = await Agendamento.findOne({ data, horario });
        if (agendamentoExistente) {
            return res.status(400).json({ message: 'Esse horário e data já está agendado.' });
        }

        const agendamento = new Agendamento({ userId, data, horario });
        await agendamento.save();
        res.status(201).json({ message: 'Agendamento criado com sucesso.' });
    } catch (err) {
        console.error('Erro ao criar agendamento:', err);
        res.status(500).json({ message: 'Erro ao criar agendamento.' });
    }
});

// Listar agendamentos (apenas admin)
router.get('/agendamentotodos', isAuthenticated, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso restrito' });
    }
    try {
        const agendamentos = await Agendamento.find().populate('userId');
        res.json(agendamentos);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao obter agendamentos' });
    }
});


// Buscar agendamento de um usuário
router.get('/agendamentomeu/:userId', isAuthenticated, async (req, res) => {
    const { userId } = req.params;
    try {
        const agendamentos = await Agendamento.find({ userId }).populate('userId'); 
        if (agendamentos.length === 0) {
            console.log(`Nenhum agendamento encontrado para o usuário com ID: ${userId}`);
            return res.status(404).json({ message: "Nenhum agendamento encontrado para este usuário." });
        }
        res.json(agendamentos);
    } catch (err) {
        console.error('Erro ao buscar agendamentos:', err);
        res.status(500).json({ message: 'Erro ao buscar agendamentos' });
    }
});

// Buscar agendamento para edição (incluindo dados do usuário)
router.get('/agendamentoparaeditar/:id', isAuthenticated, async (req, res) => {
    const agendamentoId = req.params.id;

    try {
        const agendamento = await Agendamento.findById(agendamentoId).populate('userId');
        if (!agendamento) {
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }
        res.json(agendamento); // Retorna o agendamento com os dados do usuário
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar agendamento' });
    }
});


// Atualizar agendamento
router.put('/agendamentoupdate/:id', isAuthenticated, async (req, res) => {
    const agendamentoId = req.params.id;
    const { data, horario } = req.body;

    try {
        const agendamento = await Agendamento.findById(agendamentoId);
        if (!agendamento) {
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }

        // Verificar se o novo horário já está agendado
        const agendamentoExistente = await Agendamento.findOne({ data, horario });
        if (agendamentoExistente) {
            return res.status(400).json({ message: 'Esse horário e data já está agendado.' });
        }

        // Atualizar o agendamento
        agendamento.data = data;
        agendamento.horario = horario;
        await agendamento.save();

        res.json({ message: 'Agendamento atualizado com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao atualizar agendamento.' });
    }
});


// Excluir agendamento (admin ou usuário do agendamento)
router.delete('/agendamentodelete/:id', isAuthenticated, async (req, res) => {
    const agendamentoId = req.params.id;
    const userId = req.user.userId;

    try {
        const agendamento = await Agendamento.findById(agendamentoId);
        if (!agendamento) {
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }

        if (agendamento.userId.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Acesso restrito' });
        }

        await Agendamento.findByIdAndDelete(agendamentoId);
        res.json({ message: 'Agendamento excluído com sucesso' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao excluir agendamento' });
    }
});

module.exports = router;
