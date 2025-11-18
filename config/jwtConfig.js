// =============================================
// SECCIÓN 1: IMPORTACIÓN DE DEPENDENCIAS
// =============================================

/**
 * Importa la librería jsonwebtoken que permite trabajar con tokens JWT
 * JWT (JSON Web Token) es un estándar para crear tokens de autenticación
 */
const jwt = require('jsonwebtoken');

// =============================================
// SECCIÓN 2: CONFIGURACIÓN JWT
// =============================================

/**
 * Objeto de configuración para el JWT que contiene todas las opciones necesarias
 * para generar y verificar tokens de forma segura
 */
const JWT_CONFIG = {
    // Clave secreta utilizada para firmar y verificar los tokens JWT
    // NOTA: En producción, esta clave debería estar en variables de entorno
    secret: 'navidad123',
    
    // Tiempo de expiración del token - '24h' significa 24 horas
    expiresIn: '24h',
    
    // Emisor del token - identifica quién creó el token
    issuer: 'dev-community',
    
    // Audiencia del token - identifica para quién está destinado el token
    audience: 'dev-community-users'
};

// =============================================
// SECCIÓN 3: FUNCIONES PRINCIPALES JWT
// =============================================

/**
 * Función para generar un nuevo token JWT
 * @param {Object} payload - Datos que se incluirán en el token (ej: id de usuario, roles, etc.)
 * @returns {string} Token JWT firmado
 */
const generateToken = (payload) => {
    /**
     * jwt.sign() crea un nuevo token JWT
     * Parámetros:
     * 1. payload: Los datos a incluir en el token
     * 2. secret: La clave secreta para firmar el token
     * 3. options: Opciones adicionales como expiración, emisor, audiencia
     */
    return jwt.sign(payload, JWT_CONFIG.secret, {
        expiresIn: JWT_CONFIG.expiresIn,    // Tiempo de expiración
        issuer: JWT_CONFIG.issuer,          // Quién emite el token
        audience: JWT_CONFIG.audience       // Para quién es el token
    });
};

/**
 * Función para verificar y decodificar un token JWT
 * @param {string} token - Token JWT a verificar
 * @returns {Object} Payload decodificado del token
 * @throws {Error} Si el token es inválido o ha expirado
 */
const verifyToken = (token) => {
    try {
        /**
         * jwt.verify() verifica la validez del token y lo decodifica
         * Parámetros:
         * 1. token: El token JWT a verificar
         * 2. secret: La clave secreta para verificar la firma
         * 3. options: Opciones de verificación (emisor, audiencia)
         */
        return jwt.verify(token, JWT_CONFIG.secret, {
            issuer: JWT_CONFIG.issuer,      // Verifica que el emisor sea correcto
            audience: JWT_CONFIG.audience   // Verifica que la audiencia sea correcta
        });
    } catch (error) {
        /**
         * Si ocurre algún error en la verificación (token expirado, firma inválida, etc.)
         * se lanza una excepción con un mensaje descriptivo
         */
        throw new Error('Token inválido o expirado');
    }
};

// =============================================
// SECCIÓN 4: MIDDLEWARE DE AUTENTICACIÓN
// =============================================

/**
 * Middleware de Express para autenticar solicitudes usando JWT
 * Este middleware verifica la presencia y validez del token JWT en los headers
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función para pasar al siguiente middleware
 */
const authenticateJWT = (req, res, next) => {
    // Mensaje de log para debugging - indica que el middleware se está ejecutando
    console.log('🔐 Middleware JWT ejecutándose...');
    
    /**
     * Obtiene el header de autorización de la solicitud
     * Formato esperado: "Bearer <token>"
     */
    const authHeader = req.headers.authorization;
    
    /**
     * Verifica si existe el header de autorización y si sigue el formato Bearer token
     * authHeader.startsWith('Bearer ') comprueba que empiece con "Bearer "
     */
    if (authHeader && authHeader.startsWith('Bearer ')) {
        /**
         * Extrae el token eliminando los primeros 7 caracteres ("Bearer ")
         * substring(7) remueve "Bearer " y deja solo el token
         */
        const token = authHeader.substring(7);
        
        try {
            /**
             * Intenta verificar y decodificar el token usando la función verifyToken
             * Si es válido, obtiene el payload decodificado
             */
            const decoded = verifyToken(token);
            
            /**
             * Agrega el usuario decodificado al objeto de solicitud (req)
             * para que esté disponible en los siguientes middlewares/rutas
             */
            req.user = decoded;
            
            /**
             * Agrega el token completo al objeto de solicitud
             * para posible uso posterior
             */
            req.jwtToken = token;
            
            // Mensaje de log indicando autenticación exitosa
            console.log('✅ JWT válido para usuario:', decoded.username);
            
            /**
             * Pasa al siguiente middleware o controlador de ruta
             * ya que la autenticación fue exitosa
             */
            return next();
        } catch (error) {
            /**
             * Si la verificación del token falla (expirado, inválido, etc.)
             * se captura el error y se responde con estado 401 (No autorizado)
             */
            console.log('❌ JWT inválido:', error.message);
            
            /**
             * Retorna una respuesta JSON de error con estado 401
             * y no permite continuar a la siguiente función
             */
            return res.status(401).json({
                success: false,  // Indica que la operación falló
                error: 'Token de acceso inválido o expirado'  // Mensaje de error
            });
        }
    }
    
    /**
     * Si no se encontró token JWT en el header de autorización
     * se muestra un mensaje informativo y se permite continuar
     * (esto permite otros métodos de autenticación)
     */
    console.log('ℹ️  No se encontró token JWT, continuando con otros métodos de auth...');
    
    /**
     * Pasa al siguiente middleware incluso sin token JWT
     * Esto permite que otros métodos de autenticación puedan intentarse
     */
    next();
};

// =============================================
// SECCIÓN 5: EXPORTACIÓN DE MÓDULOS
// =============================================

/**
 * Exporta todas las funciones y configuraciones para ser utilizadas en otros archivos
 */
module.exports = {
    generateToken,      // Función para generar tokens
    verifyToken,        // Función para verificar tokens
    authenticateJWT,    // Middleware de autenticación
    JWT_CONFIG          // Configuración del JWT
};