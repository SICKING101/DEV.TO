const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['like', 'unicorn', 'exploding_head', 'fire', 'heart', 'rocket'],
        required: true
    }
}, { _id: false });

const commentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    // AGREGAR ESTOS CAMPOS FALTANTES:
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likesCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true
    },
    coverImage: {
        type: String,
        default: null
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 20
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    published: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date,
        default: null
    },
    reactions: [reactionSchema],
    comments: [commentSchema],
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    readCount: {
        type: Number,
        default: 0
    },
    readingTime: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

// Calcular tiempo de lectura antes de guardar
postSchema.pre('save', function(next) {
    if (this.isModified('content')) {
        const wordsPerMinute = 200;
        const wordCount = this.content.split(/\s+/).length;
        this.readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }
    next();
});

// Método para agregar reacción
postSchema.methods.addReaction = function(userId, reactionType) {
    // Remover reacción existente del mismo usuario
    this.reactions = this.reactions.filter(r => !r.userId.equals(userId));
    
    // Agregar nueva reacción
    this.reactions.push({
        userId: userId,
        type: reactionType
    });
};

// Método para agregar comentario
postSchema.methods.addComment = function(userId, content) {
    this.comments.push({
        userId: userId,
        content: content
    });
};

// Método para toggle favorito
postSchema.methods.toggleFavorite = function(userId) {
    const index = this.favorites.indexOf(userId);
    if (index > -1) {
        this.favorites.splice(index, 1);
        return false; // removido de favoritos
    } else {
        this.favorites.push(userId);
        return true; // agregado a favoritos
    }
};

// Método para contar reacciones por tipo
postSchema.methods.getReactionCounts = function() {
    const counts = {
        like: 0,
        unicorn: 0,
        exploding_head: 0,
        fire: 0,
        heart: 0,
        rocket: 0
    };
    
    this.reactions.forEach(reaction => {
        counts[reaction.type]++;
    });
    
    return counts;
};

// Método para verificar si usuario reaccionó
postSchema.methods.hasUserReacted = function(userId) {
    return this.reactions.some(r => r.userId.equals(userId));
};

// Método para verificar si usuario favoritó
postSchema.methods.hasUserFavorited = function(userId) {
    return this.favorites.some(fav => fav.equals(userId));
};

// Índices para mejor performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ published: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ 'reactions.userId': 1 });

module.exports = mongoose.model('Post', postSchema);