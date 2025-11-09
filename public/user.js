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
        // No requerido si se usa OAuth (Google, Facebook, GitHub)
        validate: {
            validator: function(v) {
                // La contraseña es requerida solo si no hay ningún método OAuth
                return (this.googleId || this.facebookId) ? true : v && v.length >= 6;
            },
            message: 'La contraseña debe tener al menos 6 caracteres para usuarios locales'
        }
    },
    googleId: {
        type: String,
        sparse: true
    },
    facebookId: {
        type: String,
        sparse: true
    },
    profilePicture: {
        type: String,
        default: '/IMAGENES/default-avatar.png'
    },
    avatar: {
        type: String // Campo adicional para compatibilidad con Facebook
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true
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
    timestamps: true
});

// Middleware pre-save: solo cifrar si la contraseña fue modificada y existe
userSchema.pre('save', async function(next) {
    const user = this;
    
    // Solo proceder si la contraseña fue modificada y existe
    if (!user.isModified('password') || !user.password) {
        return next();
    }
    
    try {
        // Verificar longitud mínima para usuarios locales
        if (!user.googleId && !user.facebookId && user.password.length < 6) {
            return next(new Error('La contraseña debe tener al menos 6 caracteres'));
        }
        
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Método para verificar contraseña (compatible con ambos enfoques)
userSchema.methods.isCorrectPassword = function(password, callback) {
    // Si no hay contraseña (usuario de OAuth) o no hay contraseña proporcionada
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
        profilePicture: this.profilePicture || this.avatar,
        createdAt: this.createdAt,
        lastLogin: this.lastLogin
    };
};

// Virtual para verificar si es usuario de OAuth
userSchema.virtual('isOAuthUser').get(function() {
    return !!(this.googleId || this.facebookId);
});

// Virtual para verificar si es usuario local
userSchema.virtual('isLocalUser').get(function() {
    return !this.googleId && !this.facebookId && !!this.password;
});

module.exports = mongoose.model('User', userSchema);