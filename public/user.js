const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    password: {
        type: String,
        // No requerido si se usa OAuth (Google)
        validate: {
            validator: function(v) {
                // La contraseña es requerida solo si no hay googleId
                return this.googleId ? true : v && v.length >= 6;
            },
            message: 'La contraseña debe tener al menos 6 caracteres para usuarios locales'
        }
    },
    googleId: {
        type: String,
        sparse: true // Permite múltiples documentos sin googleId
    },
    profilePicture: {
        type: String,
        default: '/IMAGENES/default-avatar.png'
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true // Permite múltiples documentos sin email
    },
    displayName: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índices para mejor performance
userSchema.index({ username: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ email: 1 }, { sparse: true });

// Middleware pre-save: solo cifrar si la contraseña fue modificada y existe
userSchema.pre('save', async function(next) {
    const user = this;
    
    // Solo proceder si la contraseña fue modificada y existe
    if (!user.isModified('password') || !user.password) {
        return next();
    }
    
    try {
        // Verificar longitud mínima para usuarios locales
        if (!user.googleId && user.password.length < 6) {
            return next(new Error('La contraseña debe tener al menos 6 caracteres'));
        }
        
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Middleware pre-save alternativo (con callbacks) - manteniendo compatibilidad
userSchema.pre('save', function(next) {
    const user = this;
    
    // Si ya se procesó con async/await, continuar
    if (user.password && user.password.startsWith('$2b$')) {
        return next();
    }
    
    // Solo proceder si la contraseña fue modificada y existe
    if (!user.isModified('password') || !user.password) {
        return next();
    }
    
    // Verificar longitud mínima para usuarios locales
    if (!user.googleId && user.password.length < 6) {
        return next(new Error('La contraseña debe tener al menos 6 caracteres'));
    }
    
    bcrypt.genSalt(10, (err, salt) => {
        if (err) return next(err);
        
        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

// Método para verificar contraseña (compatible con ambos enfoques)
userSchema.methods.isCorrectPassword = function(password, callback) {
    // Si no hay contraseña (usuario de Google) o no hay contraseña proporcionada
    if (!this.password || !password) {
        return callback(null, false);
    }
    
    // Usar async/await si no se proporciona callback
    if (callback && typeof callback === 'function') {
        bcrypt.compare(password, this.password, (err, same) => {
            if (err) return callback(err);
            callback(null, same);
        });
    } else {
        // Retornar una Promise si no hay callback
        return bcrypt.compare(password, this.password);
    }
};

// Método para actualizar última conexión
userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

// Método estático para buscar por username o email
userSchema.statics.findByUsernameOrEmail = function(identifier) {
    return this.findOne({
        $or: [
            { username: identifier },
            { email: identifier }
        ]
    });
};

// Método para generar perfil público (sin información sensible)
userSchema.methods.toPublicJSON = function() {
    return {
        id: this._id,
        username: this.username,
        displayName: this.displayName,
        profilePicture: this.profilePicture,
        createdAt: this.createdAt,
        lastLogin: this.lastLogin
    };
};

// Virtual para verificar si es usuario de OAuth
userSchema.virtual('isOAuthUser').get(function() {
    return !!this.googleId;
});

// Virtual para verificar si es usuario local
userSchema.virtual('isLocalUser').get(function() {
    return !this.googleId && !!this.password;
});

module.exports = mongoose.model('User', userSchema);