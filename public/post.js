/**
 * ESQUEMA DE MONGOOSE PARA EL MODELO DE POST
 * Define la estructura de datos, relaciones y métodos para los posts del blog
 */

// Importar mongoose para la definición de esquemas y modelos
const mongoose = require('mongoose');

// =====================================================================
// SECCIÓN 1: ESQUEMA DE REACCIONES
// =====================================================================

/**
 * Esquema embebido para reacciones de usuarios a posts
 * Permite múltiples tipos de reacciones (like, unicorn, heart, etc.)
 */
const reactionSchema = new mongoose.Schema({
  // Referencia al usuario que realizó la reacción
  userId: {
    type: mongoose.Schema.Types.ObjectId, // ID único de MongoDB
    ref: 'User',                          // Referencia al modelo User
    required: true                        // Campo obligatorio
  },
  
  // Tipo de reacción con valores predefinidos
  type: {
    type: String,
    enum: ['like', 'unicorn', 'exploding_head', 'fire', 'heart', 'rocket'], // Valores permitidos
    required: true
  },
  
  // Fecha de creación de la reacción
  createdAt: {
    type: Date,
    default: Date.now // Valor por defecto: fecha actual
  }
});

// =====================================================================
// SECCIÓN 2: ESQUEMA DE COMENTARIOS
// =====================================================================

/**
 * Esquema embebido para comentarios en posts
 * Incluye funcionalidad de likes y tracking de ediciones
 */
const commentSchema = new mongoose.Schema({
  // Usuario que creó el comentario
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Contenido del comentario con validación de longitud
  content: {
    type: String,
    required: true,
    maxlength: 1000 // Límite máximo de caracteres
  },
  
  // Fecha de creación del comentario
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Fecha de última actualización
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Array de usuarios que dieron like al comentario
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Contador de likes para optimización de consultas
  likesCount: {
    type: Number,
    default: 0
  }
});

// =====================================================================
// SECCIÓN 3: ESQUEMA PRINCIPAL DE POST
// =====================================================================

/**
 * Esquema principal para posts del blog
 * Incluye todos los campos y relaciones necesarias
 */
const postSchema = new mongoose.Schema({
  // Título del post con validaciones
  title: {
    type: String,
    required: true,     // Campo obligatorio
    trim: true,         // Elimina espacios en blanco al inicio y final
    maxlength: 200      // Longitud máxima de 200 caracteres
  },
  
  // Contenido principal del post
  content: {
    type: String,
    required: true
  },
  
  // Autor del post (referencia al modelo User)
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // URL o path de la imagen de portada (opcional)
  coverImage: {
    type: String
  },
  
  // Array de tags para categorización
  tags: [{
    type: String,
    lowercase: true // Normaliza a minúsculas para búsquedas consistentes
  }],
  
  // Estado de publicación (borrador vs publicado)
  published: {
    type: Boolean,
    default: false // Por defecto está en borrador
  },
  
  // Fecha de publicación (solo cuando published = true)
  publishedAt: {
    type: Date
  },
  
  // Contador de lecturas/vistas del post
  readCount: {
    type: Number,
    default: 0
  },
  
  // Array de reacciones usando el esquema embebido
  reactions: [reactionSchema],
  
  // Array de usuarios que marcaron el post como favorito
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Array de comentarios usando el esquema embebido
  comments: [commentSchema]
  
}, {
  // Opciones del esquema
  timestamps: true // Agrega automáticamente createdAt y updatedAt
});

// =====================================================================
// SECCIÓN 4: MÉTODOS DE INSTANCIA DEL POST
// =====================================================================

/**
 * MÉTODO: Agregar o actualizar reacción de usuario
 * Permite a usuarios reaccionar a posts con diferentes tipos de reacciones
 * 
 * @param {ObjectId} userId - ID del usuario que reacciona
 * @param {String} reactionType - Tipo de reacción (like, unicorn, etc.)
 */
postSchema.methods.addReaction = function(userId, reactionType) {
  // Buscar si el usuario ya tiene una reacción en este post
  const existingReactionIndex = this.reactions.findIndex(
    reaction => reaction.userId.toString() === userId.toString()
  );

  if (existingReactionIndex > -1) {
    // Si ya existe una reacción, actualizar el tipo y fecha
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

/**
 * MÉTODO: Obtener conteo de reacciones por tipo
 * Calcula y retorna un objeto con el total de cada tipo de reacción
 * 
 * @returns {Object} Objeto con conteos de cada tipo de reacción
 */
postSchema.methods.getReactionCounts = function() {
  // Inicializar objeto con todos los tipos de reacción en 0
  const counts = {
    like: 0,
    unicorn: 0,
    exploding_head: 0,
    fire: 0,
    heart: 0,
    rocket: 0
  };

  // Contar cada reacción
  this.reactions.forEach(reaction => {
    counts[reaction.type]++;
  });

  return counts;
};

/**
 * MÉTODO: Verificar si usuario ya reaccionó al post
 * Útil para mostrar el estado de la reacción del usuario actual en la UI
 * 
 * @param {ObjectId} userId - ID del usuario a verificar
 * @returns {Boolean} true si el usuario ya reaccionó, false si no
 */
postSchema.methods.hasUserReacted = function(userId) {
  return this.reactions.some(
    reaction => reaction.userId.toString() === userId.toString()
  );
};

/**
 * MÉTODO: Alternar estado de favorito (toggle)
 * Agrega o remueve un usuario de la lista de favoritos
 * 
 * @param {ObjectId} userId - ID del usuario que marca/desmarca como favorito
 * @returns {Boolean} true si fue agregado, false si fue removido
 */
postSchema.methods.toggleFavorite = function(userId) {
  // Buscar si el usuario ya está en favoritos
  const favoriteIndex = this.favorites.findIndex(
    fav => fav && fav.toString() === userId.toString()
  );

  if (favoriteIndex > -1) {
    // Remover de favoritos si ya existe
    this.favorites.splice(favoriteIndex, 1);
    return false; // Indica que fue removido
  } else {
    // Agregar a favoritos si no existe
    this.favorites.push(userId);
    return true; // Indica que fue agregado
  }
};

/**
 * MÉTODO: Verificar si usuario marcó el post como favorito
 * 
 * @param {ObjectId} userId - ID del usuario a verificar
 * @returns {Boolean} true si el usuario tiene el post en favoritos
 */
postSchema.methods.hasUserFavorited = function(userId) {
  return this.favorites.some(
    fav => fav && fav.toString() === userId.toString()
  );
};

/**
 * MÉTODO: Actualizar post con validación de campos permitidos
 * Permite actualizar solo campos específicos y maneja lógica de publicación
 * 
 * @param {Object} updateData - Objeto con los campos a actualizar
 */
postSchema.methods.updatePost = function(updateData) {
  // Definir campos permitidos para actualización
  const allowedUpdates = ['title', 'content', 'tags', 'coverImage', 'published'];
  
  // Actualizar solo los campos permitidos
  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      this[field] = updateData[field];
    }
  });

  // Si se publica el post por primera vez, establecer publishedAt
  if (updateData.published === true && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Actualizar marca de tiempo de modificación
  this.updatedAt = new Date();
};

// =====================================================================
// SECCIÓN 5: ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
// =====================================================================

/**
 * ÍNDICES DE MONGOOSE PARA MEJORAR PERFORMANCE DE CONSULTAS
 * Cada índice optimiza diferentes tipos de búsquedas frecuentes
 */

// Índice para búsquedas de posts por autor ordenados por fecha
postSchema.index({ author: 1, createdAt: -1 });

// Índice para obtener posts publicados más recientes primero
postSchema.index({ published: 1, createdAt: -1 });

// Índice para búsquedas por tags
postSchema.index({ tags: 1 });

// Índice para verificar reacciones de usuario específico
postSchema.index({ 'reactions.userId': 1 });

// =====================================================================
// SECCIÓN 6: CREACIÓN Y EXPORTACIÓN DEL MODELO
// =====================================================================

/**
 * CREACIÓN DEL MODELO POST
 * Convierte el esquema en un modelo de Mongoose usable
 */
const Post = mongoose.model('Post', postSchema);

// Exportar el modelo para uso en otras partes de la aplicación
module.exports = Post;