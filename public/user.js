// Importar mongoose para interactuar con MongoDB y bcrypt para cifrar contraseñas
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// =====================================================================
// DEFINICIÓN DEL ESQUEMA DE USUARIO
// =====================================================================

// Crear un nuevo esquema de mongoose para los usuarios con validaciones y configuraciones
const userSchema = new mongoose.Schema({
    // Campo: Nombre de usuario único para identificar al usuario en el sistema
    username: {
        type: String,
        required: true,          // Es obligatorio para todos los usuarios
        unique: true,            // No puede haber dos usuarios con el mismo username
        trim: true,              // Elimina espacios en blanco al inicio y final
        minlength: 3,            // Mínimo 3 caracteres
        maxlength: 30            // Máximo 30 caracteres
    },
    
    // Campo: Contraseña cifrada (opcional para usuarios de OAuth)
    password: {
        type: String,
        // Validación condicional: la contraseña solo es requerida para usuarios locales
        validate: {
            validator: function(v) {
                // Si el usuario tiene GoogleId o FacebookId (OAuth), la contraseña no es requerida
                // Si es usuario local (sin OAuth), la contraseña debe tener al menos 6 caracteres
                return (this.googleId || this.facebookId) ? true : v && v.length >= 6;
            },
            message: 'La contraseña debe tener al menos 6 caracteres para usuarios locales'
        }
    },
    
    // Campo: ID único proporcionado por Google para usuarios que se registran con Google OAuth
    googleId: {
        type: String,
        sparse: true  // Permite valores null y no fuerza unicidad para valores null
    },
    
    // Campo: ID único proporcionado por Facebook para usuarios que se registran con Facebook OAuth
    facebookId: {
        type: String,
        sparse: true  // Permite valores null y no fuerza unicidad para valores null
    },
    
    // Campo: URL de la imagen de perfil del usuario
    profilePicture: {
        type: String,
        default: '/IMAGENES/default-avatar.png'  // Imagen por defecto si no se proporciona
    },
    
    // Campo: URL alternativa de avatar (para compatibilidad con Facebook u otros servicios)
    avatar: {
        type: String // Campo adicional para compatibilidad con diferentes proveedores OAuth
    },
    
    // Campo: Dirección de correo electrónico del usuario
    email: {
        type: String,
        trim: true,      // Elimina espacios en blanco
        lowercase: true, // Convierte a minúsculas para consistencia
        sparse: true     // Permite valores null
    },
    
    // Campo: Nombre para mostrar (puede ser diferente del username)
    displayName: {
        type: String,
        trim: true  // Elimina espacios en blanco
    },
    
    // Campo: Fecha de creación de la cuenta
    createdAt: {
        type: Date,
        default: Date.now  // Se establece automáticamente con la fecha actual
    },
    
    // Campo: Fecha del último inicio de sesión
    lastLogin: {
        type: Date,
        default: Date.now  // Se actualiza cada vez que el usuario inicia sesión
    },
    
    // Campo: Estado de la cuenta (activa/inactiva)
    isActive: {
        type: Boolean,
        default: true  // Por defecto todas las cuentas están activas
    }
}, {
    // Opciones del esquema: mongoose agregará automáticamente createdAt y updatedAt
    timestamps: true
});

// =====================================================================
// MIDDLEWARES (FUNCIONES QUE SE EJECUTAN ANTES/DESPUÉS DE CIERTAS OPERACIONES)
// =====================================================================

// Middleware PRE-SAVE: Se ejecuta automáticamente antes de guardar un documento
userSchema.pre('save', async function(next) {
    const user = this;  // 'this' se refiere al documento de usuario que se está guardando
    
    // Solo proceder si la contraseña fue modificada y existe
    // Esto evita cifrar la contraseña múltiples veces innecesariamente
    if (!user.isModified('password') || !user.password) {
        return next();  // Continuar con el proceso de guardado
    }
    
    try {
        // Verificación adicional de longitud para usuarios locales
        // (usuarios que NO usan OAuth de Google o Facebook)
        if (!user.googleId && !user.facebookId && user.password.length < 6) {
            return next(new Error('La contraseña debe tener al menos 6 caracteres'));
        }
        
        // Generar "salt" - dato aleatorio que se usa para cifrar la contraseña
        const salt = await bcrypt.genSalt(10);  // 10 rondas de generación de salt
        
        // Cifrar la contraseña con el salt generado
        user.password = await bcrypt.hash(user.password, salt);
        
        next();  // Continuar con el guardado del documento
    } catch (err) {
        next(err);  // Pasar el error al siguiente middleware
    }
});

// =====================================================================
// MÉTODOS DE INSTANCIA (FUNCIONES DISPONIBLES EN CADA DOCUMENTO/USUARIO)
// =====================================================================

// Método para verificar si una contraseña es correcta
// Soporta tanto callbacks tradicionales como Promises modernas
userSchema.methods.isCorrectPassword = function(password, callback) {
    // Caso: Usuario de OAuth (no tiene contraseña) o no se proporcionó contraseña
    if (!this.password || !password) {
        return callback(null, false);  // Retornar false inmediatamente
    }
    
    // Verificar usando callback (estilo tradicional)
    if (callback && typeof callback === 'function') {
        bcrypt.compare(password, this.password, (err, same) => {
            if (err) return callback(err);      // Error en la comparación
            callback(null, same);               // Retornar resultado (true/false)
        });
    } else {
        // Verificar usando Promise (estilo moderno)
        return bcrypt.compare(password, this.password);
    }
};

// Método para actualizar la fecha del último inicio de sesión
userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();  // Establecer fecha y hora actual
    return this.save();           // Guardar el documento y retornar la Promise
};

// =====================================================================
// MÉTODOS ESTÁTICOS (FUNCIONES DISPONIBLES EN EL MODELO, NO EN DOCUMENTOS INDIVIDUALES)
// =====================================================================

// Método estático para buscar usuario por username O email
// Útil para login donde el usuario puede usar cualquiera de los dos
userSchema.statics.findByUsernameOrEmail = function(identifier) {
    return this.findOne({
        $or: [  // Operador OR de MongoDB
            { username: identifier },  // Buscar por username
            { email: identifier }      // Buscar por email
        ]
    });
};

// =====================================================================
// MÉTODOS PARA TRANSFORMACIÓN DE DATOS
// =====================================================================

// Método para generar una versión pública segura del perfil de usuario
// Elimina información sensible como contraseñas e IDs de OAuth
userSchema.methods.toPublicJSON = function() {
    return {
        id: this._id,                                // ID único de MongoDB
        username: this.username,                     // Nombre de usuario
        displayName: this.displayName,               // Nombre para mostrar
        profilePicture: this.profilePicture || this.avatar,  // Imagen de perfil (usa avatar como fallback)
        createdAt: this.createdAt,                   // Fecha de creación
        lastLogin: this.lastLogin                    // Último inicio de sesión
    };
};

// =====================================================================
// VIRTUALES (PROPIEDADES CALCULADAS, NO SE ALMACENAN EN LA BASE DE DATOS)
// =====================================================================

// Virtual: Verifica si el usuario se registró mediante OAuth (Google o Facebook)
userSchema.virtual('isOAuthUser').get(function() {
    return !!(this.googleId || this.facebookId);  // Doble negación para convertir a booleano
});

// Virtual: Verifica si el usuario es local (registrado directamente en la aplicación)
userSchema.virtual('isLocalUser').get(function() {
    return !this.googleId && !this.facebookId && !!this.password;
});

// =====================================================================
// EXPORTACIÓN DEL MODELO
// =====================================================================

// Crear y exportar el modelo de mongoose basado en el esquema definido
// 'User' será el nombre de la colección en MongoDB (se pluraliza a 'users')
module.exports = mongoose.model('User', userSchema);