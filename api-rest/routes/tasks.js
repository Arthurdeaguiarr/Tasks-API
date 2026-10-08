const express = require('express');
const { body, validationResult } = require('express-validator');
const tasksController = require('../controllers/tasksController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * Middleware de autenticação - todas as rotas requerem autenticação
 */
router.use(authMiddleware);

/**
 * Middleware para validação
 */
const validateTask = [
     body('title')
        .notEmpty().withMessage('Título é obrigatório')
        .isLength({ min: 1, max: 255 }).withMessage('Título deve ter entre 1 e 255 caracteres'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high']).withMessage('Prioridade deve ser low, medium ou high'),
    body('description')
        .optional()
        .isLength({ max: 1000 }).withMessage('Descrição não pode ter mais de 1000 caracteres'),
];

// na atualização todos os campos são opcionais
const validateTaskUpdate = [
    body('title')
        .optional()
        .isLength({ min: 1, max: 255 }).withMessage('Título deve ter entre 1 e 255 caracteres'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high']).withMessage('Prioridade deve ser low, medium ou high'),
    body('status')
        .optional()
        .isIn(['pending', 'completed']).withMessage('Status deve ser pending ou completed'),
    body('description')
        .optional({ values: 'null' })
        .isLength({ max: 1000 }).withMessage('Descrição não pode ter mais de 1000 caracteres'),
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
 * GET /api/tasks
 * Obter todas as tarefas do usuário
 * Query params: status (pending|completed), sort (date|priority)
 */
router.get('/', tasksController.getAllTasks);

/**
 * GET /api/tasks/:id
 * Obter uma tarefa específica
 */
router.get('/:id', tasksController.getTaskById);

/**
 * POST /api/tasks
 * Criar nova tarefa
 * Body: { title, description?, priority? }
 */
router.post('/', validateTask, handleValidationErrors, tasksController.createTask);

/**
 * PUT /api/tasks/:id
 * Atualizar tarefa
 * Body: { title?, description?, priority?, status? }
 */
router.put('/:id', validateTaskUpdate, handleValidationErrors, tasksController.updateTask);

/**
 * DELETE /api/tasks/:id
 * Deletar tarefa
 */
router.delete('/:id', tasksController.deleteTask);

/**
 * PATCH /api/tasks/:id/complete
 * Marcar tarefa como concluída
 */
router.patch('/:id/complete', tasksController.completeTask);

module.exports = router;