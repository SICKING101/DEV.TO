// public/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { generateToken } = require('../config/jwtConfig');
// Prueba temporal
const testToken = generateToken({ id: 1, username: 'Jared' });
console.log('🔑 Token generado:', testToken);

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
        validate: {
            validator: function(v) {
                return (this.googleId || this.facebookId || this.githubId) ? true : v && v.length >= 6;
            },
            message: 'La contraseña debe tener al menos 6 caracteres para usuarios locales'
        }
    },
    
    // 🔥 NUEVO: Campos para gestión de tokens JWT
    tokens: [{
        token: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            required: true
        },
        device: {
            type: String,
            default: 'web'
        },
        lastUsed: {
            type: Date,
            default: Date.now
        }
    }],
    
    googleId: { type: String, sparse: true },
    facebookId: { type: String, sparse: true },
    githubId: { type: String, sparse: true },
    profilePicture: { type: String, default: '/IMAGENES/default-avatar.png' },
    avatar: { type: String },
    email: { type: String, trim: true, lowercase: true, sparse: true },
    displayName: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

// =====================================================================
// MIDDLEWARES
// =====================================================================
userSchema.pre('save', async function(next) {
    const user = this;
    
    if (!user.isModified('password') || !user.password) {
        return next();
    }
    
    try {
        if (!user.googleId && !user.facebookId && !user.githubId && user.password.length < 6) {
            return next(new Error('La contraseña debe tener al menos 6 caracteres'));
        }
        
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// =====================================================================
// MÉTODOS JWT - NUEVOS
// =====================================================================

// Generar token JWT y guardarlo en el usuario
userSchema.methods.generateAuthToken = async function(device = 'web') {
    const user = this;
    
    const tokenPayload = {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        authProvider: 'local'
    };
    
    const token = generateToken(tokenPayload);
    
    // Calcular fecha de expiración (24 horas)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Guardar token en el array de tokens del usuario
    user.tokens.push({
        token,
        expiresAt,
        device,
        lastUsed: new Date()
    });
    
    // Limitar a 5 tokens activos por usuario
    if (user.tokens.length > 5) {
        user.tokens = user.tokens.slice(-5);
    }
    
    await user.save();
    
    console.log(`✅ Token JWT generado para ${user.username} en dispositivo: ${device}`);
    return token;
};

// Revocar token específico
userSchema.methods.revokeToken = async function(tokenToRevoke) {
    const user = this;
    user.tokens = user.tokens.filter(tokenObj => tokenObj.token !== tokenToRevoke);
    await user.save();
    console.log(`✅ Token revocado para ${user.username}`);
};

// Revocar todos los tokens
userSchema.methods.revokeAllTokens = async function() {
    const user = this;
    user.tokens = [];
    await user.save();
    console.log(`✅ Todos los tokens revocados para ${user.username}`);
};

// Verificar si un token es válido
userSchema.methods.isTokenValid = async function(tokenToCheck) {
    const user = this;
    const tokenObj = user.tokens.find(t => t.token === tokenToCheck);
    
    if (!tokenObj) {
        return false;
    }
    
    if (new Date() > tokenObj.expiresAt) {
        await this.revokeToken(tokenToCheck);
        return false;
    }
    
    tokenObj.lastUsed = new Date();
    await user.save();
    
    return true;
};

// Buscar usuario por token JWT
userSchema.statics.findByToken = async function(token) {
    console.log('🔍 Buscando usuario por token JWT...');
    
    const user = await this.findOne({ 'tokens.token': token });
    
    if (!user) {
        console.log('❌ No se encontró usuario con el token proporcionado');
        return null;
    }
    
    const isValid = await user.isTokenValid(token);
    
    if (!isValid) {
        console.log('❌ Token no es válido o ha expirado');
        return null;
    }
    
    console.log(`✅ Usuario encontrado por token: ${user.username}`);
    return user;
};

// =====================================================================
// MÉTODOS EXISTENTES (se mantienen igual)
// =====================================================================
userSchema.methods.isCorrectPassword = function(password, callback) {
    if (!this.password || !password) {
        if (callback && typeof callback === 'function') {
            return callback(null, false);
        }
        return Promise.resolve(false);
    }
    
    if (callback && typeof callback === 'function') {
        bcrypt.compare(password, this.password, (err, same) => {
            if (err) return callback(err);
            callback(null, same);
        });
    } else {
        return bcrypt.compare(password, this.password);
    }
};

userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

userSchema.statics.findByUsernameOrEmail = function(identifier) {
    return this.findOne({
        $or: [
            { username: identifier },
            { email: identifier }
        ]
    });
};

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

userSchema.virtual('isOAuthUser').get(function() {
    return !!(this.googleId || this.facebookId || this.githubId);
});

userSchema.virtual('isLocalUser').get(function() {
    return !this.googleId && !this.facebookId && !this.githubId && !!this.password;
});

module.exports = mongoose.model('User', userSchema);