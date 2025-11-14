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
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
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
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverImage: {
    type: String
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  published: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  readCount: {
    type: Number,
    default: 0
  },
  reactions: [reactionSchema],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema]
}, {
  timestamps: true
});

// Método para agregar reacción
postSchema.methods.addReaction = function(userId, reactionType) {
  const existingReactionIndex = this.reactions.findIndex(
    reaction => reaction.userId.toString() === userId.toString()
  );

  if (existingReactionIndex > -1) {
    // Si ya existe una reacción, actualizarla
    this.reactions[existingReactionIndex].type = reactionType;
    this.reactions[existingReactionIndex].createdAt = new Date();
  } else {
    // Si no existe, agregar nueva reacción
    this.reactions.push({
      userId: userId,
      type: reactionType,
      createdAt: new Date()
    });
  }
};

// Método para obtener conteo de reacciones
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
  return this.reactions.some(
    reaction => reaction.userId.toString() === userId.toString()
  );
};

// Método para toggle de favoritos
postSchema.methods.toggleFavorite = function(userId) {
  const favoriteIndex = this.favorites.findIndex(
    fav => fav && fav.toString() === userId.toString()
  );

  if (favoriteIndex > -1) {
    this.favorites.splice(favoriteIndex, 1);
    return false; // Removido de favoritos
  } else {
    this.favorites.push(userId);
    return true; // Agregado a favoritos
  }
};

// Método para verificar si usuario favoritó
postSchema.methods.hasUserFavorited = function(userId) {
  return this.favorites.some(
    fav => fav && fav.toString() === userId.toString()
  );
};

// Método para actualizar post
postSchema.methods.updatePost = function(updateData) {
  const allowedUpdates = ['title', 'content', 'tags', 'coverImage', 'published'];
  
  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      this[field] = updateData[field];
    }
  });

  if (updateData.published === true && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  this.updatedAt = new Date();
};

// Índices para mejor performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ published: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ 'reactions.userId': 1 });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;