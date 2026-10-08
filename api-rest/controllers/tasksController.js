const { pool } = require('../config/database');
const { AppError } = require('../utils/errorHandler');

/**
 * obter todas as tarefas do usuário
 * get /api/tasks
 */

exports.getAllTasks = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { status, sort } = req.query;

        let query = 'SELECT * FROM tasks WHERE user_id = ?';
        const params = [userId];

        // filtro por status 
        if(status && ['pending', 'completed'].includes(status)) {
            query += ' AND status = ?';
            params.push(status);
        }

        // ordenação
        if(sort === 'priority') {
            query += ' ORDER BY priority DESC, created_at DESC';
        } else {
            query += ' ORDER BY created_at DESC';
        }

        const connection = await pool.getConnection();
        
        try {
            const [results] = await connection.query(query, params);

            return res.status(200).json({
                success: true,
                count: results.length,
                tasks: results
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        next(error);
    }
};

/**
 * obter uma tarefa específica
 * get /api/tasks/:id
 */

exports.getTaskById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const connection = await pool.getConnection();
        try{
            const [results] = await connection.query(
                'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
                [id, userId]
            );

            if(results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Tarefa não encontrada'
                });
            }

            return res.status(200).json({
                success: true,
                task: results[0]
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Criar nova tarefa
 * POST /api/tasks
 */
exports.createTask = async (req, res, next) => {
    try {
        const { title, description, priority } = req.body;
        const userId = req.user.id;

        // Validações
        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Título da tarefa é obrigatório',
            });
        }

        if (title.length > 255) {
            return res.status(400).json({
                success: false,
                message: 'Título não pode ter mais de 255 caracteres',
            });
        }

        const validPriorities = ['low', 'medium', 'high'];
        const taskPriority = priority && validPriorities.includes(priority) ? priority : 'medium';

        const connection = await pool.getConnection();

        try {
            const [result] = await connection.query(
                'INSERT INTO tasks (user_id, title, description, priority, status) VALUES (?, ?, ?, ?, ?)',
                [userId, title, description || null, taskPriority, 'pending']
                );

            return res.status(201).json({
                success: true,
                message: 'Tarefa criada com sucesso',
                task: {
                    id: result.insertId,
                    user_id: userId,
                    title,
                    description: description || null,
                    priority: taskPriority,
                    status: 'pending',
                    created_at: new Date(),
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
 * Atualizar tarefa
 * PUT /api/tasks/:id
 */
exports.updateTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, priority, status } = req.body;
        const userId = req.user.id;

        // Validação de ID
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID da tarefa inválido',
            });
        }

        const connection = await pool.getConnection();

        try {
            // Verifica se tarefa existe e pertence ao usuário
            const [taskExists] = await connection.query(
                'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
                [id, userId]
                );

            if (taskExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Tarefa não encontrada',
                });
            }

            // Prepara dados para atualização
            const updateData = {};
            if (title) updateData.title = title;
            // permite limpar a descrição enviando string vazia ou null
            if (description !== undefined) updateData.description = description || null;
            if (priority && ['low', 'medium', 'high'].includes(priority)) {
                updateData.priority = priority;
            }
            if (status && ['pending', 'completed'].includes(status)) {
                updateData.status = status;
            }

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Nenhum campo válido informado para atualização',
                });
            }

            updateData.updated_at = new Date();

            // Atualiza tarefa
            await connection.query(
                'UPDATE tasks SET ? WHERE id = ? AND user_id = ?',
                [updateData, id, userId]
            );

            return res.status(200).json({
                success: true,
                message: 'Tarefa atualizada com sucesso',
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Deletar tarefa
 * DELETE /api/tasks/:id
 */
exports.deleteTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const connection = await pool.getConnection();

        try {
            // Verifica se tarefa existe e pertence ao usuário
            const [taskExists] = await connection.query(
                'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
                [id, userId]
                );

            if (taskExists.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Tarefa não encontrada',
                });
            }

            // Deleta tarefa
            await connection.query(
                'DELETE FROM tasks WHERE id = ? AND user_id = ?',
                [id, userId]
                );

            return res.status(200).json({
                success: true,
                message: 'Tarefa deletada com sucesso',
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Marcar tarefa como concluída
 * PATCH /api/tasks/:id/complete
 */
exports.completeTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const connection = await pool.getConnection();

        try {
            const [taskExists] = await connection.query(
                'SELECT status FROM tasks WHERE id = ? AND user_id = ?',
                [id, userId]
                );

            if (taskExists.length === 0) {
                return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada',
                });
            }

            await connection.query(
                'UPDATE tasks SET status = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
                ['completed', id, userId]
            );

            return res.status(200).json({
                success: true,
                message: 'Tarefa marcada como concluída',
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        next(error);
    }
};