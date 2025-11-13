// Dependencia del JWT
const jwt = require('jsonwebtoken');

// Configuracion del JWT
const JWT_CONFIG = {
    secret: 'navidad123',
    expiresIn: '24h',
    issuer: 'dev-community',
    audience: 'dev-community-users'
};

// Generar token JWT
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_CONFIG.secret, {
        expiresIn: JWT_CONFIG.expiresIn,
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
    });
};

// Verificar token JWT
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_CONFIG.secret, {
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience
        });
    } catch (error) {
        throw new Error('Token inválido o expirado');
    }
};

// Middleware de autenticación JWT
const authenticateJWT = (req, res, next) => {
    console.log('🔐 Middleware JWT ejecutándose...');
    
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
            const decoded = verifyToken(token);
            req.user = decoded;
            req.jwtToken = token;
            console.log('✅ JWT válido para usuario:', decoded.username);
            return next();
        } catch (error) {
            console.log('❌ JWT inválido:', error.message);
            return res.status(401).json({
                success: false,
                error: 'Token de acceso inválido o expirado'
            });
        }
    }
    
    console.log('ℹ️  No se encontró token JWT, continuando con otros métodos de auth...');
    next();
};

module.exports = {
    generateToken,
    verifyToken,
    authenticateJWT,
    JWT_CONFIG
};