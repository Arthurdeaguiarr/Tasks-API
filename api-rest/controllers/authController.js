const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { AppError } = require('../utils/errorHandler');

/**
 * Gera um JWT token
 */
const generateToken = (userId, email) => {
    return jwt.sign(
        { userId, email }, // o que está sendo adicionado dentro do token
        process.env.JWT_SECRET, // onde o token é assinado
        { expiresIn: process.env.JWT_EXPIRE || '7d' } 
    );
};

/**
 * Registrar novo usuário
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, passwordConfirm } = req.body;

        // Validações básicas
        if (!name || !email || !password || !passwordConfirm) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios',
            });
        }

        if (password !== passwordConfirm) {
            return res.status(400).json({
                success: false,
                message: 'As senhas não correspondem',
            });
        }

        const connection = await pool.getConnection();

        try {
            // Verifica se o email já existe
            const [results] = await connection.query(
                'SELECT email FROM users WHERE email = ?',
                [email]
            );

            if (results.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email já está registrado',
                });
            }

            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insere novo usuário
            await connection.query(
                'INSERT INTO users SET ?',
                { name, email, password: hashedPassword }
            );

            return res.status(201).json({
                success: true,
                message: 'Usuário registrado com sucesso',
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Login do usuário
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validações
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email e senha são obrigatórios',
            });
        }   

        const connection = await pool.getConnection();

        try {
            // Busca usuário no banco
            const [results] = await connection.query(
                'SELECT id, email, password, name FROM users WHERE email = ?',
                [email]
            );

            if (results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Email ou senha incorretos',
                });
            }

            const user = results[0];

            // Compara senha
            const isPasswordCorrect = await bcrypt.compare(password, user.password);

            if (!isPasswordCorrect) {
                return res.status(401).json({
                    success: false,
                    message: 'Email ou senha incorretos',
                });
            }

            // Gera token
            const token = generateToken(user.id, user.email);

            return res.status(200).json({
                success: true,
                message: 'Login realizado com sucesso',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Obter perfil do usuário autenticado
 * GET /api/auth/profile
 */
exports.getProfile = async (req, res, next) => {
    try {
        const connection = await pool.getConnection();

        try {
            const [results] = await connection.query(
                'SELECT id, name, email, created_at FROM users WHERE id = ?',
                [req.user.id]
            );

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado',
                });
            }

            return res.status(200).json({
                success: true,
                user: results[0],
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        next(error);
    }
};