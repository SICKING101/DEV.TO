/******************************************************
 *                IMPORTACIÓN DE MÓDULOS
 ******************************************************/
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('./passportConfig');
const mongoose = require('mongoose');
const User = require('./public/user');
const Post = require('./public/post');
const multer = require('multer');
const app = express();

/******************************************************
 *             CONFIGURACIÓN DE MULTER
 ******************************************************/
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Carpeta uploads creada');
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cover-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'));
        }
    }
});

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'El archivo es demasiado grande' });
        }
    }
    next(error);
});

/******************************************************
 *             CONFIGURACIÓN DE MIDDLEWARES
 ******************************************************/
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));

app.use(session({
    secret: 'dev-community-secret-key-2024',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

/******************************************************
 *              CONEXIÓN A MONGODB
 ******************************************************/
const mongo_url = 'mongodb://localhost/mongo1_curso';
mongoose.connect(mongo_url)
    .then(() => console.log(`✅ Conectado a MongoDB en ${mongo_url}`))
    .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

/******************************************************
 *                RUTAS PRINCIPALES
 ******************************************************/
app.get('/', (req, res) => {
    if (req.session.user || req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, 'public', 'PAGINA', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'Login.html'));
    }
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'PAGINA', 'index.html'));
});

app.get('/createPost', (req, res) => {
    if (!req.session.user && !req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'PERFIL', 'createPost.html'));
});

/******************************************************
 *              RUTAS DE POSTS
 ******************************************************/

// Crear nuevo post
app.post('/api/posts', upload.single('coverImage'), async (req, res) => {
    try {
        console.log('=== INICIANDO CREACIÓN DE POST ===');
        
        if (!req.session.user && !req.isAuthenticated()) {
            console.log('❌ Usuario no autenticado');
            return res.status(401).json({ 
                success: false,
                error: 'Debes iniciar sesión para crear un post' 
            });
        }

        const { title, content, tags, published } = req.body;
        const userId = req.session.user ? req.session.user.id : req.user._id;

        console.log('📝 Datos recibidos:', {
            title: title ? `${title.substring(0, 50)}...` : 'Vacío',
            contentLength: content ? content.length : 0,
            tags: tags || 'No tags',
            published: published || 'false',
            userId: userId
        });

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                error: 'El título del post es requerido'
            });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                error: 'El contenido del post es requerido'
            });
        }

        if (title.length > 200) {
            return res.status(400).json({
                success: false,
                error: 'El título no puede tener más de 200 caracteres'
            });
        }

        let tagsArray = [];
        if (tags && tags.trim()) {
            tagsArray = tags.split(',')
                .map(tag => tag.trim().toLowerCase())
                .filter(tag => tag.length > 0)
                .slice(0, 4);
        }

        const postData = {
            title: title.trim(),
            content: content.trim(),
            tags: tagsArray,
            author: userId,
            published: published === 'true',
            publishedAt: published === 'true' ? new Date() : null
        };

        if (req.file) {
            postData.coverImage = `/uploads/${req.file.filename}`;
            console.log('🖼️ Imagen de portada guardada:', postData.coverImage);
        }

        console.log('💾 Guardando post en la base de datos...');

        const post = new Post(postData);
        await post.save();

        await post.populate('author', 'username profilePicture');

        console.log('✅ Post creado exitosamente - ID:', post._id);

        res.status(201).json({
            success: true,
            message: published === 'true' ? '🎉 Post publicado exitosamente' : '💾 Post guardado como borrador',
            post: {
                id: post._id,
                title: post.title,
                author: post.author,
                published: post.published,
                coverImage: post.coverImage
            }
        });

    } catch (error) {
        console.error('❌ ERROR AL CREAR POST:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Datos del post inválidos',
                details: Object.values(error.errors).map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al crear el post',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obtener todos los posts publicados
app.get('/api/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find({ published: true })
            .populate('author', 'username profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const postsWithReactions = posts.map(post => {
            const reactionCounts = {
                like: 0,
                unicorn: 0,
                exploding_head: 0,
                fire: 0,
                heart: 0,
                rocket: 0
            };

            post.reactions.forEach(reaction => {
                reactionCounts[reaction.type]++;
            });

            const currentUserId = req.session.user ? req.session.user.id : null;
            
            return {
                ...post,
                reactionCounts,
                hasReacted: currentUserId ? 
                    post.reactions.some(r => r.userId && r.userId.toString() === currentUserId.toString()) : false,
                hasFavorited: currentUserId ? 
                    post.favorites.some(fav => fav && fav.toString() === currentUserId.toString()) : false,
                favoritesCount: post.favorites.length,
                commentsCount: post.comments ? post.comments.length : 0
            };
        });

        const totalPosts = await Post.countDocuments({ published: true });

        res.json({
            posts: postsWithReactions,
            totalPages: Math.ceil(totalPosts / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Error al obtener posts:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener posts',
            details: error.message 
        });
    }
});

// Obtener post individual
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username profilePicture')
            .populate('comments.userId', 'username profilePicture');

        if (!post) {
            return res.status(404).json({ 
                success: false,
                error: 'Post no encontrado' 
            });
        }

        post.readCount += 1;
        await post.save();

        const currentUserId = req.session.user ? req.session.user.id : null;
        const reactionCounts = post.getReactionCounts();

        const postWithDetails = {
            ...post.toObject(),
            reactionCounts,
            hasReacted: currentUserId ? post.hasUserReacted(currentUserId) : false,
            hasFavorited: currentUserId ? post.hasUserFavorited(currentUserId) : false,
            favoritesCount: post.favorites.length
        };

        res.json({
            success: true,
            post: postWithDetails
        });
    } catch (error) {
        console.error('Error al obtener post:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener post',
            details: error.message 
        });
    }
});

// Agregar reacción a post
app.post('/api/posts/:id/reactions', async (req, res) => {
    try {
        if (!req.session.user && !req.isAuthenticated()) {
            return res.status(401).json({ 
                success: false,
                error: 'No autenticado' 
            });
        }

        const { reactionType } = req.body;
        const userId = req.session.user ? req.session.user.id : req.user._id;
        const postId = req.params.id;

        console.log('🎭 Agregando reacción:', { userId, postId, reactionType });

        const validReactions = ['like', 'unicorn', 'exploding_head', 'fire', 'heart', 'rocket'];
        if (!validReactions.includes(reactionType)) {
            return res.status(400).json({ 
                success: false,
                error: 'Tipo de reacción inválido' 
            });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ 
                success: false,
                error: 'Post no encontrado' 
            });
        }

        post.addReaction(userId, reactionType);
        await post.save();

        const reactionCounts = post.getReactionCounts();
        const hasReacted = post.hasUserReacted(userId);

        res.json({
            success: true,
            reactionCounts,
            hasReacted,
            userReaction: reactionType
        });
    } catch (error) {
        console.error('Error al agregar reacción:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al agregar reacción',
            details: error.message 
        });
    }
});

// =============================================
// ENDPOINTS DE COMENTARIOS - CORREGIDOS
// =============================================

// Agregar comentario - VERSIÓN MEJORADA
app.post('/api/posts/:id/comments', async (req, res) => {
    try {
        console.log('💬 === INICIANDO AGREGADO DE COMENTARIO ===');
        
        if (!req.session.user && !req.isAuthenticated()) {
            console.log('❌ Usuario no autenticado para comentar');
            return res.status(401).json({ 
                success: false,
                error: 'Debes iniciar sesión para comentar' 
            });
        }

        const { content } = req.body;
        const userId = req.session.user ? req.session.user.id : req.user._id;
        const postId = req.params.id;

        console.log('📝 Datos del comentario:', {
            postId,
            userId,
            contentLength: content ? content.length : 0,
            contentPreview: content ? content.substring(0, 50) + '...' : 'Vacío'
        });

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'El comentario no puede estar vacío' 
            });
        }

        if (content.length > 1000) {
            return res.status(400).json({ 
                success: false,
                error: 'El comentario no puede tener más de 1000 caracteres' 
            });
        }

        const post = await Post.findById(postId);
        if (!post) {
            console.log('❌ Post no encontrado:', postId);
            return res.status(404).json({ 
                success: false,
                error: 'Post no encontrado' 
            });
        }

        console.log('✅ Post encontrado, agregando comentario...');

        // Crear el comentario
        const newComment = {
            userId: userId,
            content: content.trim(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Agregar el comentario al array de comentarios del post
        post.comments.push(newComment);
        await post.save();

        console.log('✅ Comentario guardado en la base de datos');

        // Obtener el comentario recién agregado con información del usuario
        const savedPost = await Post.findById(postId)
            .populate('comments.userId', 'username profilePicture');
        
        const lastComment = savedPost.comments[savedPost.comments.length - 1];

        console.log('✅ Comentario populado con información del usuario');

        res.json({
            success: true,
            message: 'Comentario agregado exitosamente',
            comment: {
                _id: lastComment._id,
                content: lastComment.content,
                createdAt: lastComment.createdAt,
                userId: {
                    _id: lastComment.userId._id,
                    username: lastComment.userId.username,
                    profilePicture: lastComment.userId.profilePicture || '/IMAGENES/default-avatar.png'
                }
            }
        });

    } catch (error) {
        console.error('❌ ERROR AL AGREGAR COMENTARIO:', error);
        console.error('❌ Stack trace:', error.stack);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                success: false,
                error: 'ID de post inválido' 
            });
        }

        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor al agregar comentario',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obtener comentarios de un post
app.get('/api/posts/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('📥 Solicitando comentarios para post:', id);

        const post = await Post.findById(id)
            .populate('comments.userId', 'username profilePicture')
            .select('comments');

        if (!post) {
            console.log('❌ Post no encontrado:', id);
            return res.status(404).json({ 
                success: false,
                error: 'Post no encontrado' 
            });
        }

        const comments = post.comments || [];
        
        console.log(`✅ Encontrados ${comments.length} comentarios para post ${id}`);

        // Formatear comentarios para el frontend
        const formattedComments = comments.map(comment => ({
            _id: comment._id,
            content: comment.content,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            userId: {
                _id: comment.userId._id,
                username: comment.userId.username,
                profilePicture: comment.userId.profilePicture || '/IMAGENES/default-avatar.png'
            },
            likesCount: comment.likesCount || 0,
            hasLiked: false // Por defecto, se puede implementar lógica de likes después
        }));

        res.json({
            success: true,
            comments: formattedComments
        });

    } catch (error) {
        console.error('❌ Error al obtener comentarios:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener comentarios',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Eliminar comentario - VERSIÓN DEFINITIVA
app.delete('/api/comments/:id', async (req, res) => {
    try {
        if (!req.session.user && !req.isAuthenticated()) {
            return res.status(401).json({ 
                success: false,
                error: 'No autenticado' 
            });
        }

        const commentId = req.params.id;
        const userId = req.session.user ? req.session.user.id : req.user._id;

        console.log('🗑️ Intentando eliminar comentario:', { commentId, userId });

        // Encontrar el post que contiene el comentario
        const post = await Post.findOne({ 
            'comments._id': new mongoose.Types.ObjectId(commentId) 
        });

        if (!post) {
            console.log('❌ Post con comentario no encontrado');
            return res.status(404).json({ 
                success: false,
                error: 'Comentario no encontrado' 
            });
        }

        // Encontrar el comentario específico
        const comment = post.comments.find(c => 
            c._id.toString() === commentId
        );

        if (!comment) {
            console.log('❌ Comentario no encontrado en el post');
            return res.status(404).json({ 
                success: false,
                error: 'Comentario no encontrado' 
            });
        }

        // Verificar que el usuario sea el dueño del comentario
        if (comment.userId.toString() !== userId.toString()) {
            console.log('❌ Usuario no autorizado para eliminar comentario');
            return res.status(403).json({ 
                success: false,
                error: 'No tienes permiso para eliminar este comentario' 
            });
        }

        // Eliminar el comentario usando $pull (forma correcta)
        const result = await Post.updateOne(
            { _id: post._id },
            { $pull: { comments: { _id: new mongoose.Types.ObjectId(commentId) } } }
        );

        console.log('✅ Resultado de eliminación:', result);

        if (result.modifiedCount === 0) {
            throw new Error('No se pudo eliminar el comentario');
        }

        console.log('✅ Comentario eliminado exitosamente de la base de datos');

        res.json({
            success: true,
            message: 'Comentario eliminado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar comentario:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al eliminar comentario',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Actualizar comentario - VERSIÓN DEFINITIVA
app.put('/api/comments/:id', async (req, res) => {
    try {
        if (!req.session.user && !req.isAuthenticated()) {
            return res.status(401).json({ 
                success: false,
                error: 'No autenticado' 
            });
        }

        const commentId = req.params.id;
        const { content } = req.body;
        const userId = req.session.user ? req.session.user.id : req.user._id;

        console.log('✏️ Intentando actualizar comentario:', { commentId, userId });

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'El comentario no puede estar vacío' 
            });
        }

        if (content.length > 1000) {
            return res.status(400).json({ 
                success: false,
                error: 'El comentario no puede tener más de 1000 caracteres' 
            });
        }

        // Encontrar el post que contiene el comentario
        const post = await Post.findOne({ 
            'comments._id': new mongoose.Types.ObjectId(commentId) 
        });

        if (!post) {
            console.log('❌ Post con comentario no encontrado');
            return res.status(404).json({ 
                success: false,
                error: 'Comentario no encontrado' 
            });
        }

        // Encontrar el comentario específico
        const comment = post.comments.find(c => 
            c._id.toString() === commentId
        );

        if (!comment) {
            console.log('❌ Comentario no encontrado en el post');
            return res.status(404).json({ 
                success: false,
                error: 'Comentario no encontrado' 
            });
        }

        // Verificar que el usuario sea el dueño del comentario
        if (comment.userId.toString() !== userId.toString()) {
            console.log('❌ Usuario no autorizado para editar comentario');
            return res.status(403).json({ 
                success: false,
                error: 'No tienes permiso para editar este comentario' 
            });
        }

        // Actualizar el comentario usando $set
        const result = await Post.updateOne(
            { 
                _id: post._id, 
                'comments._id': new mongoose.Types.ObjectId(commentId) 
            },
            { 
                $set: { 
                    'comments.$.content': content.trim(),
                    'comments.$.updatedAt': new Date()
                } 
            }
        );

        console.log('✅ Resultado de actualización:', result);

        if (result.modifiedCount === 0) {
            throw new Error('No se pudo actualizar el comentario');
        }

        console.log('✅ Comentario actualizado exitosamente en la base de datos');

        // Obtener el comentario actualizado
        const updatedPost = await Post.findOne({ 
            'comments._id': new mongoose.Types.ObjectId(commentId) 
        }).populate('comments.userId', 'username profilePicture');

        const updatedComment = updatedPost.comments.find(c => 
            c._id.toString() === commentId
        );

        res.json({
            success: true,
            message: 'Comentario actualizado exitosamente',
            comment: {
                _id: updatedComment._id,
                content: updatedComment.content,
                updatedAt: updatedComment.updatedAt,
                userId: {
                    _id: updatedComment.userId._id,
                    username: updatedComment.userId.username,
                    profilePicture: updatedComment.userId.profilePicture || '/IMAGENES/default-avatar.png'
                }
            }
        });

    } catch (error) {
        console.error('❌ Error al actualizar comentario:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al actualizar comentario',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Toggle favorito
app.post('/api/posts/:id/favorite', async (req, res) => {
    try {
        if (!req.session.user && !req.isAuthenticated()) {
            return res.status(401).json({ 
                success: false,
                error: 'No autenticado' 
            });
        }

        const userId = req.session.user ? req.session.user.id : req.user._id;
        const postId = req.params.id;

        console.log('🔖 Toggle favorito:', { userId, postId });

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ 
                success: false,
                error: 'Post no encontrado' 
            });
        }

        const addedToFavorites = post.toggleFavorite(userId);
        await post.save();

        res.json({
            success: true,
            addedToFavorites,
            favoritesCount: post.favorites.length,
            message: addedToFavorites ? 'Agregado a favoritos' : 'Removido de favoritos'
        });
    } catch (error) {
        console.error('Error al manejar favorito:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al manejar favorito',
            details: error.message 
        });
    }
});

/******************************************************
 *              REGISTRO DE USUARIOS
 ******************************************************/
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !password)
            return res.status(400).send('Usuario y contraseña son requeridos');

        if (password.length < 6)
            return res.status(400).send('La contraseña debe tener al menos 6 caracteres');

        const existingUser = await User.findOne({ username });
        if (existingUser)
            return res.status(400).send('El usuario ya existe');

        const user = new User({ username, email, password });
        await user.save();

        res.status(200).send('Usuario registrado exitosamente');
    } catch (err) {
        console.error('Error al registrar usuario:', err);
        res.status(500).send('Error al registrar usuario');
    }
});

/******************************************************
 *             AUTENTICACIÓN DE USUARIOS
 ******************************************************/
app.post('/authenticate', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password)
            return res.status(400).send('Usuario y contraseña son requeridos');

        const user = await User.findOne({ username });
        if (!user)
            return res.status(401).send('Usuario y/o contraseña incorrectos');

        user.isCorrectPassword(password, (err, result) => {
            if (err) {
                console.error('Error al verificar contraseña:', err);
                return res.status(500).send('Error al autenticar');
            }

            if (result) {
                req.session.user = {
                    id: user._id,
                    username: user.username,
                    email: user.email || `${user.username}@devcommunity.com`,
                    profilePicture: user.profilePicture || '/IMAGENES/default-avatar.png',
                    authProvider: 'local'
                };
                res.status(200).json({
                    success: true,
                    message: 'Usuario autenticado correctamente',
                    user: req.session.user
                });
            } else {
                res.status(401).send('Usuario y/o contraseña incorrectos');
            }
        });
    } catch (err) {
        console.error('Error en autenticación:', err);
        res.status(500).send('Error al autenticar al usuario');
    }
});

/******************************************************
 *              CIERRE DE SESIÓN
 ******************************************************/
app.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) {
            console.error('❌ Error en req.logout:', err);
        }
        
        req.session.destroy(function(err) {
            if (err) {
                console.error('❌ Error al destruir sesión:', err);
                return res.status(500).send('Error al cerrar sesión');
            }
            
            res.clearCookie('connect.sid');
            res.redirect('/');
        });
    });
});

/******************************************************
 *         RUTA PARA OBTENER DATOS DEL USUARIO
 ******************************************************/
app.get('/api/user', (req, res) => {
    if (req.session.user) {
        return res.json({ user: req.session.user });
    }
    
    if (req.isAuthenticated() && req.user) {
        const userData = {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email || `${req.user.username}@devcommunity.com`,
            profilePicture: req.user.profilePicture || '/IMAGENES/default-avatar.png',
            authProvider: req.user.authProvider || 'OAuth'
        };
        
        req.session.user = userData;
        
        return res.json({ user: userData });
    }
    
    res.json({ user: null });
});

/******************************************************
 *        AUTENTICACIÓN CON GOOGLE
 ******************************************************/
app.get('/auth/google',
    passport.authenticate('google', { 
        scope: ['profile', 'email']
    })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { 
        failureRedirect: '/Login.html'
    }),
    (req, res) => {
        if (!req.user) {
            return res.redirect('/Login.html');
        }

        const userSessionData = {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email || `${req.user.username}@gmail.com`,
            profilePicture: req.user.profilePicture || '/IMAGENES/default-avatar.png',
            authProvider: 'Google'
        };

        req.session.user = userSessionData;
        res.redirect('/index?oauth=google&t=' + Date.now());
    }
);

/******************************************************
 *        AUTENTICACIÓN CON FACEBOOK
 ******************************************************/
app.get('/auth/facebook', 
    passport.authenticate('facebook', { 
        scope: ['email', 'public_profile']
    })
);

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { 
        failureRedirect: '/Login.html'
    }),
    (req, res) => {
        if (!req.user) {
            return res.redirect('/Login.html');
        }

        const userSessionData = {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email || `${req.user.username}@facebook.com`,
            profilePicture: req.user.profilePicture || '/IMAGENES/default-avatar.png',
            authProvider: 'Facebook'
        };

        req.session.user = userSessionData;
        res.redirect('/index?oauth=facebook&t=' + Date.now());
    }
);

/******************************************************
 *        AUTENTICACIÓN CON GITHUB
 ******************************************************/
app.get('/auth/github',
    passport.authenticate('github', { 
        scope: ['user:email']
    })
);

app.get('/auth/github/callback',
    passport.authenticate('github', { 
        failureRedirect: '/Login.html'
    }),
    (req, res) => {
        if (!req.user) {
            return res.redirect('/Login.html');
        }

        const userSessionData = {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email || `${req.user.username}@github.com`,
            profilePicture: req.user.profilePicture || '/IMAGENES/default-avatar.png',
            authProvider: 'GitHub'
        };

        req.session.user = userSessionData;
        res.redirect('/index?oauth=github&t=' + Date.now());
    }
);

/******************************************************
 *              INICIO DEL SERVIDOR
 ******************************************************/
app.listen(3000, () => {
    console.log('🚀 Servidor iniciado en el puerto 3000');
    console.log('📝 Create Post: http://localhost:3000/createPost');
    console.log('🏠 Index: http://localhost:3000/index');
    console.log('💬 Endpoints de comentarios disponibles:');
    console.log('   POST /api/posts/:id/comments');
    console.log('   GET  /api/posts/:id/comments');
    console.log('   PUT  /api/comments/:id');
    console.log('   DELETE /api/comments/:id');
});

module.exports = app;