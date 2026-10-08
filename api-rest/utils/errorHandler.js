/**
 * classe para tratamento padronizado de erros
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * middleware para tratamento de erros global
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;

    // erros de validação
    if(err.array && typeof err.array === 'function') {
        return res.status(400).json({
            success: false,
            message: 'Erro na validação dos dados',
            errors: err.array()
        });
    }

    // JSON malformado no corpo da requisição
    if(err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'JSON inválido no corpo da requisição'
        });
    }

    // erro de banco de dados genérico
    if(typeof err.code === 'string' && err.code.startsWith('ER_')) {
        console.error('Erro de banco de dados:', err.code, err.message);

        if(err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Registro já existe'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Erro ao processar requisição no banco de dados'
        });
    }

    // erros inesperados: loga e não expõe detalhes internos ao cliente
    if(statusCode >= 500) {
        console.error(err);
    }

    res.status(statusCode).json({
        success: false,
        message: statusCode >= 500 ? 'Erro interno do servidor' : err.message
    });
};

module.exports = { AppError, errorHandler };
