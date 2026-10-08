-- ===============================================
-- Script de criação do banco de dados
-- Task Management API
-- ===============================================

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS task_management_db;
USE task_management_db;

-- ===============================================
-- Tabela de Usuários
-- ===============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
)   ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- Tabela de Tarefas
-- ===============================================
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pending', 'completed') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Chave estrangeira para usuário
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  -- Índices para melhor performance
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
)   ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- Dados de exemplo (opcional)
-- ===============================================
-- Descomente para inserir dados de teste
-- INSERT INTO users (name, email, password) VALUES
-- ('João Silva', 'joao@example.com', 'senha_hash_aqui');