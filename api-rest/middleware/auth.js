const jwt = require('jsonwebtoken');

/**
 *  middleware para verificar autenticação via jwt
 *  extrai o token do header authorization e valida
 */
const authMiddleware = async (req, res, next) => {
    try {
        // extrai o token do header (formato: "Bearer <token>")
        const [scheme, token] = (req.headers.authorization || '').split(' ');

        if(scheme !== 'Bearer' || !token) {
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido. Faça login primeiro.',
            });
        }

        // verifica e decodifica o token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // adiciona dados do usuário à requisição
        req.user = {
            id: decoded.userId,
            email: decoded.email
        };
        next();
    } catch (error) {
        if(error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado. Faça login novamente.'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Token inválido.'
        });
    }
};

module.exports = authMiddleware;
