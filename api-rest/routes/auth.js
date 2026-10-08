const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * Middleware de validação
 */
const validateRegister = [
    body('name')
        .notEmpty().withMessage('Nome é obrigatório')
        .isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres'),
    body('email')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('passwordConfirm')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('As senhas não correspondem'),
];

const validateLogin = [
    body('email')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Senha é obrigatória'),
];

/**
 * Middleware para capturar erros de validação
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Erro na validação dos dados',
            errors: errors.array(),
        });  
    }
    next();
};

// ROTAS

/**
 * POST /api/auth/register
 * Registrar novo usuário
 */
router.post('/register', validateRegister, handleValidationErrors, authController.register);

/**
 * POST /api/auth/login
 * Login do usuário
 */
router.post('/login', validateLogin, handleValidationErrors, authController.login);

/**
 * GET /api/auth/profile
 * Obter perfil do usuário autenticado
 */
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;