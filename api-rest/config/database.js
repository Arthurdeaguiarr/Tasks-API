const mysql = require('mysql2/promise'); 
require('dotenv').config();

// pool de conexões para melhorar a performance
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true, // se o limite de conexões é atingido, as novas requisições ficam na fila
    connectionLimit: 10, // mantem no máximo 10 conexões simultaneamente
    queueLimit: 0, // fila ilimitada
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// teste de conexão
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Conectado ao banco de dados MySQL com sucesso!');
        connection.release(); // previne o vazamento de conexões
    } catch(error) {
        console.error('Erro ao conectar ao banco de dados:', error.message);
        process.exit(1);
    }
}

module.exports = { pool, testConnection };
