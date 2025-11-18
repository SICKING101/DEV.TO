/******************************************************
 * SECCIÓN 1: IMPORTACIÓN DE DEPENDENCIAS
 ******************************************************/

// ODM (Object Document Mapper) para MongoDB - maneja esquemas y modelos
const mongoose = require('mongoose');

// Librería para hashing de contraseñas - seguridad
const bcrypt = require('bcrypt');

// Configuración JWT para generación y verificación de tokens
const { generateToken } = require('../config/jwtConfig');

// Prueba temporal para verificar que JWT funciona correctamente
const testToken = generateToken({ id: 1, username: 'Jared Admin' });
console.log('🔑 Token generado:', testToken);

/******************************************************
 * SECCIÓN 2: DEFINICIÓN DEL ESQUEMA DE USUARIO
 ******************************************************/

/**
 * Esquema principal del modelo User para MongoDB
 * Define la estructura, validaciones y tipos de datos del usuario
 */
const userSchema = new mongoose.Schema({
    // =================================================
    // CAMPO: username - Identificador principal
    // =================================================
    username: {
        type: String,                   // Tipo de dato String
        required: true,                 // Campo obligatorio
        unique: true,                   // Valor único en la base de datos
        trim: true,                     // Eliminar espacios en blanco al inicio/fin
        minlength: 3,                   // Longitud mínima de 3 caracteres
        maxlength: 30                   // Longitud máxima de 30 caracteres
    },
    
    // =================================================
    // CAMPO: password - Contraseña hasheada
    // =================================================
    password: {
        type: String,
        // Validación condicional: solo requerida para usuarios locales (no OAuth)
        validate: {
            validator: function(v) {
                // Si es usuario OAuth (tiene Google, Facebook o GitHub ID), no requiere contraseña
                // Si es usuario local, requiere contraseña de al menos 6 caracteres
                return (this.googleId || this.facebookId || this.githubId) ? true : v && v.length >= 6;
            },
            message: 'La contraseña debe tener al menos 6 caracteres para usuarios locales'
        }
    },
    
    // =================================================
    // 🔥 NUEVO: Campos para gestión de tokens JWT
    // =================================================
    tokens: [{
        // Token JWT individual
        token: {
            type: String,
            required: true
        },
        // Fecha de creación del token
        createdAt: {
            type: Date,
            default: Date.now
        },
        // Fecha de expiración del token
        expiresAt: {
            type: Date,
            required: true
        },
        // Dispositivo desde donde se generó el token
        device: {
            type: String,
            default: 'web'
        },
        // Última vez que se usó el token
        lastUsed: {
            type: Date,
            default: Date.now
        }
    }],
    
    // =================================================
    // CAMPOS PARA AUTENTICACIÓN CON TERCEROS (OAuth)
    // =================================================
    
    // ID único proporcionado por Google OAuth
    googleId: { 
        type: String, 
        sparse: true  // Permite valores nulos pero mantiene unicidad para valores no nulos
    },
    
    // ID único proporcionado por Facebook OAuth
    facebookId: { 
        type: String, 
        sparse: true 
    },
    
    // ID único proporcionado por GitHub OAuth
    githubId: { 
        type: String, 
        sparse: true 
    },
    
    // =================================================
    // CAMPOS DE PERFIL E INFORMACIÓN PERSONAL
    // =================================================
    
    // URL de la imagen de perfil del usuario
    profilePicture: { 
        type: String, 
        default: '/IMAGENES/default-avatar.png'  // Imagen por defecto
    },
    
    // Campo alternativo para avatar (compatibilidad)
    avatar: { 
        type: String 
    },
    
    // Email del usuario
    email: { 
        type: String, 
        trim: true,      // Eliminar espacios
        lowercase: true, // Convertir a minúsculas
        sparse: true     // Permite valores nulos
    },
    
    // Nombre para mostrar (puede ser diferente del username)
    displayName: { 
        type: String, 
        trim: true 
    },
    
    // =================================================
    // CAMPOS DE METADATOS Y AUDITORÍA
    // =================================================
    
    // Fecha de creación del usuario
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    
    // Último inicio de sesión del usuario
    lastLogin: { 
        type: Date, 
        default: Date.now 
    },
    
    // Estado del usuario (activo/inactivo)
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, {
    // Opciones del esquema
    timestamps: true  // Agrega automáticamente createdAt y updatedAt
});

/******************************************************
 * SECCIÓN 3: MIDDLEWARES (HOOKS) DE MONGOOSE
 ******************************************************/

/**
 * Middleware pre-save: Se ejecuta ANTES de guardar un documento
 * Se encarga de hashear la contraseña si fue modificada
 */
userSchema.pre('save', async function(next) {
    const user = this; // Referencia al documento actual
    
    // Si la contraseña no fue modificada o no existe, continuar
    if (!user.isModified('password') || !user.password) {
        return next();
    }
    
    try {
        // Validar longitud mínima para usuarios locales
        if (!user.googleId && !user.facebookId && !user.githubId && user.password.length < 6) {
            return next(new Error('La contraseña debe tener al menos 6 caracteres'));
        }
        
        // Generar salt (valor aleatorio para hashing)
        const salt = await bcrypt.genSalt(10);
        
        // Hashear la contraseña con el salt
        user.password = await bcrypt.hash(user.password, salt);
        
        // Continuar con el guardado
        next();
    } catch (err) {
        // Pasar error al siguiente middleware
        next(err);
    }
});

/******************************************************
 * SECCIÓN 4: MÉTODOS JWT - GESTIÓN DE TOKENS
 ******************************************************/

/**
 * MÉTODO DE INSTANCIA: Generar token JWT y guardarlo en el usuario
 * @param {string} device - Dispositivo desde donde se genera el token (web, mobile, etc.)
 * @returns {Promise<string>} - Token JWT generado
 */
userSchema.methods.generateAuthToken = async function(device = 'web') {
    const user = this; // Referencia al documento actual
    
    // Payload del token JWT - información que se almacena en el token
    const tokenPayload = {
        id: user._id.toString(),        // ID del usuario como string
        username: user.username,        // Nombre de usuario
        email: user.email,              // Email del usuario
        profilePicture: user.profilePicture, // Foto de perfil
        authProvider: 'local'           // Proveedor de autenticación
    };
    
    // Generar token JWT usando la configuración
    const token = generateToken(tokenPayload);
    
    // Calcular fecha de expiración (24 horas desde ahora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Guardar token en el array de tokens del usuario
    user.tokens.push({
        token,                          // Token JWT generado
        expiresAt,                      // Fecha de expiración
        device,                         // Dispositivo
        lastUsed: new Date()            // Último uso (ahora)
    });
    
    // Limitar a 5 tokens activos por usuario (evitar acumulación)
    if (user.tokens.length > 50) {
        user.tokens = user.tokens.slice(-5); // Mantener solo los últimos 5 tokens
    }
    
    // Guardar cambios en la base de datos
    await user.save();
    
    console.log(`✅ Token JWT generado para ${user.username} en dispositivo: ${device}`);
    return token; // Devolver token generado
};

/**
 * MÉTODO DE INSTANCIA: Revocar (eliminar) un token específico
 * @param {string} tokenToRevoke - Token JWT a revocar
 * @returns {Promise<void>}
 */
userSchema.methods.revokeToken = async function(tokenToRevoke) {
    const user = this;
    
    // Filtrar el array de tokens, eliminando el token especificado
    user.tokens = user.tokens.filter(tokenObj => tokenObj.token !== tokenToRevoke);
    
    // Guardar cambios
    await user.save();
    
    console.log(`✅ Token revocado para ${user.username}`);
};

/**
 * MÉTODO DE INSTANCIA: Revocar todos los tokens del usuario
 * @returns {Promise<void>}
 */
userSchema.methods.revokeAllTokens = async function() {
    const user = this;
    
    // Vaciar array de tokens
    user.tokens = [];
    
    // Guardar cambios
    await user.save();
    
    console.log(`✅ Todos los tokens revocados para ${user.username}`);
};

/**
 * MÉTODO DE INSTANCIA: Verificar si un token es válido y no ha expirado
 * @param {string} tokenToCheck - Token JWT a verificar
 * @returns {Promise<boolean>} - true si el token es válido, false si no
 */
userSchema.methods.isTokenValid = async function(tokenToCheck) {
    const user = this;
    
    // Buscar el token en el array de tokens del usuario
    const tokenObj = user.tokens.find(t => t.token === tokenToCheck);
    
    // Si no se encuentra el token, no es válido
    if (!tokenObj) {
        return false;
    }
    
    // Verificar si el token ha expirado
    if (new Date() > tokenObj.expiresAt) {
        // Si expiró, revocarlo automáticamente
        await this.revokeToken(tokenToCheck);
        return false;
    }
    
    // Actualizar última vez que se usó el token
    tokenObj.lastUsed = new Date();
    await user.save();
    
    // Token válido
    return true;
};

/**
 * MÉTODO ESTÁTICO: Buscar usuario por token JWT
 * @param {string} token - Token JWT a buscar
 * @returns {Promise<User|null>} - Usuario encontrado o null
 */
userSchema.statics.findByToken = async function(token) {
    console.log('🔍 Buscando usuario por token JWT...');
    
    // Buscar usuario que tenga este token en su array de tokens
    const user = await this.findOne({ 'tokens.token': token });
    
    // Si no se encuentra usuario, retornar null
    if (!user) {
        console.log('❌ No se encontró usuario con el token proporcionado');
        return null;
    }
    
    // Verificar si el token es válido y no ha expirado
    const isValid = await user.isTokenValid(token);
    
    // Si el token no es válido, retornar null
    if (!isValid) {
        console.log('❌ Token no es válido o ha expirado');
        return null;
    }
    
    console.log(`✅ Usuario encontrado por token: ${user.username}`);
    return user; // Retornar usuario encontrado
};

/******************************************************
 * SECCIÓN 5: MÉTODOS EXISTENTES (MANTENIDOS)
 ******************************************************/

/**
 * MÉTODO DE INSTANCIA: Verificar si la contraseña es correcta
 * @param {string} password - Contraseña a verificar
 * @param {Function} callback - Callback opcional (para compatibilidad)
 * @returns {Promise<boolean>|void} - true si la contraseña es correcta
 */
userSchema.methods.isCorrectPassword = function(password, callback) {
    // Si no hay contraseña almacenada o no se proporcionó contraseña
    if (!this.password || !password) {
        if (callback && typeof callback === 'function') {
            return callback(null, false); // Retornar false via callback
        }
        return Promise.resolve(false); // Retornar false via Promise
    }
    
    // Si se proporcionó callback, usar versión con callback
    if (callback && typeof callback === 'function') {
        bcrypt.compare(password, this.password, (err, same) => {
            if (err) return callback(err); // Error en comparación
            callback(null, same); // Retornar resultado
        });
    } else {
        // Retornar Promise con el resultado de la comparación
        return bcrypt.compare(password, this.password);
    }
};

/**
 * MÉTODO DE INSTANCIA: Actualizar fecha de último login
 * @returns {Promise<User>} - Usuario actualizado
 */
userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date(); // Establecer fecha actual
    return this.save(); // Guardar y retornar Promise
};

/**
 * MÉTODO ESTÁTICO: Buscar usuario por username o email
 * @param {string} identifier - Username o email a buscar
 * @returns {Promise<User|null>} - Usuario encontrado o null
 */
userSchema.statics.findByUsernameOrEmail = function(identifier) {
    return this.findOne({
        $or: [ // Operador OR de MongoDB
            { username: identifier }, // Buscar por username
            { email: identifier }     // Buscar por email
        ]
    });
};

/**
 * MÉTODO DE INSTANCIA: Convertir usuario a objeto JSON público
 * (Excluye información sensible como contraseñas y tokens)
 * @returns {Object} - Objeto JSON con información pública del usuario
 */
userSchema.methods.toPublicJSON = function() {
    return {
        id: this._id,                           // ID del usuario
        username: this.username,                // Nombre de usuario
        displayName: this.displayName,          // Nombre para mostrar
        profilePicture: this.profilePicture || this.avatar, // Imagen de perfil
        createdAt: this.createdAt,              // Fecha de creación
        lastLogin: this.lastLogin               // Último login
    };
};

/******************************************************
 * SECCIÓN 6: VIRTUALES - PROPIEDADES CALCULADAS
 ******************************************************/

/**
 * VIRTUAL: Verificar si el usuario es de OAuth (Google, Facebook, GitHub)
 * @returns {boolean} - true si es usuario OAuth
 */
userSchema.virtual('isOAuthUser').get(function() {
    return !!(this.googleId || this.facebookId || this.githubId);
});

/**
 * VIRTUAL: Verificar si el usuario es local (con contraseña)
 * @returns {boolean} - true si es usuario local
 */
userSchema.virtual('isLocalUser').get(function() {
    return !this.googleId && !this.facebookId && !this.githubId && !!this.password;
});

/******************************************************
 * SECCIÓN 7: EXPORTACIÓN DEL MODELO
 ******************************************************/

// Crear y exportar el modelo User basado en el esquema
module.exports = mongoose.model('User', userSchema);