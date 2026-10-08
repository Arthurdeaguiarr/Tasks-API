const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { pool, testConnection } = require('./config/database');
const { errorHandler } = require('./utils/errorHandler');

// Importar rotas
const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');

// Inicializar express
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

// Segurança
app.use(helmet());

// CORS
// Em produção, defina CORS_ORIGIN (ex.: https://seu-dominio.com)
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ROTAS ====================

/**
 * Rota de health check
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API está funcionando corretamente',
        timestamp: new Date(),
    });
});

/**
 * Rotas de autenticação
 */
app.use('/api/auth', authRoutes);

/**
 * Rotas de tarefas
 */
app.use('/api/tasks', tasksRoutes);

/**
 * Rota não encontrada (404)
 */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada',
        path: req.originalUrl,
    });
});

// ==================== TRATAMENTO DE ERROS ====================

app.use(errorHandler);

// ==================== INICIAR SERVIDOR ====================

const startServer = async () => {
    try {
        // Teste de conexão com banco de dados
        await testConnection();

        // Inicia servidor
        app.listen(PORT, () => {
            console.log(` Task Management API iniciada com sucesso `);
            console.log(` Servidor rodando em http://localhost:${PORT}`);
            console.log(` Health check: GET http://localhost:${PORT}/health`);
            console.log(` Ambiente: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error(' Erro ao iniciar o servidor:', error);
        process.exit(1);
    }
};

// Só inicia quando executado diretamente (permite importar o app em testes)
if (require.main === module) {
    if (!process.env.JWT_SECRET) {
        console.error(' JWT_SECRET não definido. Configure o arquivo .env.');
        process.exit(1);
    }

    startServer();

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n Encerrando servidor...');
        await pool.end();
        process.exit(0);
    });
}

module.exports = app;