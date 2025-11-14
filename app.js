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
const router = express.Router();
const multer = require('multer');
const { authenticateJWT } = require('./config/jwtConfig');
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
        httpOnly: true,
        sameSite: 'lax'
    },
    name: 'devcommunity.sid'
}));

app.use(passport.initialize());
app.use(passport.session());

// 🔥 MIDDLEWARE PARA DEBUGGING DE SESIONES
app.use((req, res, next) => {
    console.log('🔍 Middleware de sesión - Estado:');
    console.log('   - Session ID:', req.sessionID);
    console.log('   - req.session.user:', req.session.user ? req.session.user.username : 'No');
    console.log('   - req.isAuthenticated():', req.isAuthenticated());
    console.log('   - req.user:', req.user ? req.user.username : 'No');
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

/******************************************************
 *              CONEXIÓN A MONGODB
 ******************************************************/
const mongo_url = 'mongodb://localhost/mongo1_curso';
mongoose.connect(mongo_url)
    .then(() => console.log(`✅ Conectado a MongoDB en ${mongo_url}`))
    .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

/******************************************************
 *         MIDDLEWARE DE AUTENTICACIÓN HÍBRIDO
 ******************************************************/
const requireAuthHybrid = (req, res, next) => {
    console.log('🔐 Middleware de autenticación híbrido ejecutándose...');
    
    // Primero verificar JWT
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { verifyToken } = require('./config/jwtConfig');
        
        try {
            const decoded = verifyToken(token);
            req.user = decoded;
            req.jwtToken = token;
            req.authMethod = 'jwt';
            console.log('✅ Autenticado via JWT:', decoded.username);
            return next();
        } catch (error) {
            console.log('❌ JWT inválido, probando otros métodos...');
        }
    }
    
    // Si no hay JWT válido, verificar sesión
    if (req.session.user) {
        req.user = req.session.user;
        req.authMethod = 'session';
        console.log('✅ Autenticado via Session:', req.session.user.username);
        return next();
    }
    
    // Si no hay sesión, verificar Passport
    if (req.isAuthenticated() && req.user) {
        req.authMethod = 'passport';
        console.log('✅ Autenticado via Passport:', req.user.username);
        return next();
    }
    
    console.log('❌ No autenticado - Sin JWT, sesión ni Passport');
    return res.status(401).json({ 
        success: false,
        error: 'No autenticado. Por favor inicia sesión.' 
    });
};

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

app.get('/createPost', requireAuthHybrid, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'PERFIL', 'createPost.html'));
});

/******************************************************
 *              RUTAS DE AUTENTICACIÓN CON JWT
 ******************************************************/
app.post('/register', async (req, res) => {
    try {
        console.log('📝 === INICIANDO REGISTRO DE USUARIO ===');
        const { username, email, password } = req.body;

        console.log('📋 Datos recibidos:', { 
            username, 
            email: email || 'No proporcionado', 
            password: password ? '***' : 'No proporcionada' 
        });

        if (!username || !password) {
            console.log('❌ Faltan campos requeridos');
            return res.status(400).json({ 
                success: false,
                error: 'Usuario y contraseña son requeridos' 
            });
        }

        if (password.length < 6) {
            console.log('❌ Contraseña muy corta');
            return res.status(400).json({ 
                success: false,
                error: 'La contraseña debe tener al menos 6 caracteres' 
            });
        }

        console.log('🔍 Verificando si el usuario existe...');
        const existingUser = await User.findOne({ 
            $or: [
                { username: username },
                { email: email }
            ]
        });

        if (existingUser) {
            console.log('❌ Usuario ya existe:', existingUser.username);
            return res.status(400).json({ 
                success: false,
                error: 'El usuario o email ya están registrados. Por favor inicia sesión.' 
            });
        }

        console.log('✅ Usuario no existe, creando nuevo usuario...');
        const user = new User({ 
            username, 
            email: email || `${username}@devcommunity.com`, 
            password 
        });

        await user.save();
        console.log('✅ Usuario registrado exitosamente:', user.username);

        res.status(200).json({
            success: true,
            message: 'Usuario registrado exitosamente. Ahora puedes iniciar sesión.'
        });

    } catch (err) {
        console.error('❌ ERROR AL REGISTRAR USUARIO:', err);
        
        if (err.code === 11000) {
            return res.status(400).json({ 
                success: false,
                error: 'El usuario o email ya están registrados' 
            });
        }
        
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                success: false,
                error: 'Datos de usuario inválidos',
                details: Object.values(err.errors).map(e => e.message)
            });
        }

        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor al registrar usuario'
        });
    }
});

app.post('/authenticate', async (req, res) => {
    try {
        console.log('🔐 === INICIANDO AUTENTICACIÓN LOCAL CON JWT ===');
        const { username, password, device = 'web' } = req.body;

        console.log('📋 Datos de login:', { 
            username, 
            password: password ? '***' : 'No proporcionada',
            device
        });

        if (!username || !password) {
            console.log('❌ Faltan credenciales');
            return res.status(400).json({ 
                success: false,
                error: 'Usuario y contraseña son requeridos' 
            });
        }

        console.log('🔍 Buscando usuario en la base de datos...');
        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        });

        if (!user) {
            console.log('❌ Usuario no encontrado:', username);
            return res.status(401).json({ 
                success: false,
                error: 'Usuario y/o contraseña incorrectos' 
            });
        }

        console.log('✅ Usuario encontrado:', user.username);
        console.log('🔑 Verificando contraseña...');

        const isPasswordCorrect = await user.isCorrectPassword(password);
        
        if (!isPasswordCorrect) {
            console.log('❌ Contraseña incorrecta para usuario:', user.username);
            return res.status(401).json({ 
                success: false,
                error: 'Usuario y/o contraseña incorrectos' 
            });
        }

        console.log('✅ Contraseña correcta, generando tokens...');

        // Actualizar último login
        await user.updateLastLogin();

        // 🔥 GENERAR TOKEN JWT
        const jwtToken = await user.generateAuthToken(device);
        
        // Configurar sesión (para compatibilidad)
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email || `${user.username}@devcommunity.com`,
            profilePicture: user.profilePicture || '/IMAGENES/default-avatar.png',
            authProvider: 'local',
            lastLogin: user.lastLogin
        };

        // Autenticar con Passport (para compatibilidad)
        req.login(user, (err) => {
            if (err) {
                console.error('❌ Error en req.login:', err);
                return res.status(500).json({ 
                    success: false,
                    error: 'Error al iniciar sesión' 
                });
            }

            console.log('✅ Autenticación completa - Sesión, Passport y JWT configurados');
            console.log('🔄 Redirigiendo a /index...');

            res.json({
                success: true,
                message: 'Usuario autenticado correctamente',
                user: req.session.user,
                token: jwtToken, // 🔥 NUEVO: Incluir token JWT
                expiresIn: '24h',
                redirect: '/index'
            });
        });

    } catch (err) {
        console.error('❌ ERROR EN AUTENTICACIÓN:', err);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor al autenticar usuario',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

/******************************************************
 *         ENDPOINTS JWT - NUEVOS
 ******************************************************/
app.get('/api/auth/verify', authenticateJWT, (req, res) => {
    res.json({
        success: true,
        user: req.user,
        message: 'Token JWT válido'
    });
});

app.post('/api/auth/refresh', authenticateJWT, async (req, res) => {
    try {
        const oldToken = req.jwtToken;
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        await user.revokeToken(oldToken);
        const newToken = await user.generateAuthToken(req.body.device || 'web');
        
        res.json({
            success: true,
            token: newToken,
            expiresIn: '24h',
            message: 'Token refrescado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error refrescando token:', error);
        res.status(500).json({
            success: false,
            error: 'Error al refrescar token'
        });
    }
});

app.post('/api/auth/logout', authenticateJWT, async (req, res) => {
    try {
        const token = req.jwtToken;
        const user = await User.findById(req.user.id);
        
        if (user) {
            await user.revokeToken(token);
        }
        
        req.session.destroy(() => {
            req.logout(() => {
                res.json({
                    success: true,
                    message: 'Sesión cerrada y token revocado exitosamente'
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Error en logout JWT:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cerrar sesión'
        });
    }
});

/******************************************************
 *         RUTA PARA OBTENER DATOS DEL USUARIO
 ******************************************************/
app.get('/api/user', requireAuthHybrid, (req, res) => {
    console.log('🔍 Estado de autenticación:');
    console.log('   - Método:', req.authMethod);
    console.log('   - User:', req.user.username);
    
    res.json({ 
        user: req.user,
        authMethod: req.authMethod
    });
});

/******************************************************
 *              RUTAS DE POSTS CON AUTENTICACIÓN HÍBRIDA
 ******************************************************/
// Crear nuevo post
app.post('/api/posts', requireAuthHybrid, upload.single('coverImage'), async (req, res) => {
    try {
        console.log('=== INICIANDO CREACIÓN DE POST ===');
        
        const { title, content, tags, published } = req.body;
        
        // Obtener user ID del método de autenticación usado
        let userId;
        if (req.authMethod === 'jwt') {
            userId = req.user.id;
        } else {
            userId = req.session.user ? req.session.user.id : req.user._id;
        }

        console.log('📝 Datos recibidos:', {
            title: title ? `${title.substring(0, 50)}...` : 'Vacío',
            contentLength: content ? content.length : 0,
            tags: tags || 'No tags',
            published: published || 'false',
            userId: userId,
            authMethod: req.authMethod
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

// Agregar reacción a post
app.post('/api/posts/:id/reactions', requireAuthHybrid, async (req, res) => {
    try {
        console.log('🎭 === INICIANDO AGREGADO DE REACCIÓN ===');
        
        const { reactionType } = req.body;
        
        // Obtener user ID del método de autenticación usado
        let userId;
        if (req.authMethod === 'jwt') {
            userId = req.user.id;
        } else {
            userId = req.session.user ? req.session.user.id : req.user._id;
        }
        
        const postId = req.params.id;

        console.log('📝 Datos de reacción:', { 
            userId, 
            postId, 
            reactionType,
            authMethod: req.authMethod
        });

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

        console.log('✅ Reacción agregada exitosamente');

        res.json({
            success: true,
            reactionCounts,
            hasReacted,
            userReaction: reactionType
        });
    } catch (error) {
        console.error('❌ Error al agregar reacción:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al agregar reacción',
            details: error.message 
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

// Agregar comentario
app.post('/api/posts/:id/comments', requireAuthHybrid, async (req, res) => {
    try {
        console.log('💬 === INICIANDO AGREGADO DE COMENTARIO ===');
        
        const { content } = req.body;
        
        // Obtener user ID del método de autenticación usado
        let userId;
        if (req.authMethod === 'jwt') {
            userId = req.user.id;
        } else {
            userId = req.session.user ? req.session.user.id : req.user._id;
        }
        
        const postId = req.params.id;

        console.log('📝 Datos del comentario:', {
            postId,
            userId,
            contentLength: content ? content.length : 0,
            contentPreview: content ? content.substring(0, 50) + '...' : 'Vacío',
            authMethod: req.authMethod
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

        const newComment = {
            userId: userId,
            content: content.trim(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        post.comments.push(newComment);
        await post.save();

        console.log('✅ Comentario guardado en la base de datos');

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
            hasLiked: false
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

// Eliminar comentario
app.delete('/api/comments/:id', requireAuthHybrid, async (req, res) => {
    try {
        const commentId = req.params.id;
        
        // Obtener user ID del método de autenticación usado
        let userId;
        if (req.authMethod === 'jwt') {
            userId = req.user.id;
        } else {
            userId = req.session.user ? req.session.user.id : req.user._id;
        }

        console.log('🗑️ Intentando eliminar comentario:', { commentId, userId, authMethod: req.authMethod });

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

        if (comment.userId.toString() !== userId.toString()) {
            console.log('❌ Usuario no autorizado para eliminar comentario');
            return res.status(403).json({ 
                success: false,
                error: 'No tienes permiso para eliminar este comentario' 
            });
        }

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

// Actualizar comentario
app.put('/api/comments/:id', requireAuthHybrid, async (req, res) => {
    try {
        const commentId = req.params.id;
        const { content } = req.body;
        
        // Obtener user ID del método de autenticación usado
        let userId;
        if (req.authMethod === 'jwt') {
            userId = req.user.id;
        } else {
            userId = req.session.user ? req.session.user.id : req.user._id;
        }

        console.log('✏️ Intentando actualizar comentario:', { commentId, userId, authMethod: req.authMethod });

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

        if (comment.userId.toString() !== userId.toString()) {
            console.log('❌ Usuario no autorizado para editar comentario');
            return res.status(403).json({ 
                success: false,
                error: 'No tienes permiso para editar este comentario' 
            });
        }

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
app.post('/api/posts/:id/favorite', requireAuthHybrid, async (req, res) => {
    try {
        // Obtener user ID del método de autenticación usado
        let userId;
        if (req.authMethod === 'jwt') {
            userId = req.user.id;
        } else {
            userId = req.session.user ? req.session.user.id : req.user._id;
        }

        const postId = req.params.id;

        console.log('🔖 Toggle favorito:', { userId, postId, authMethod: req.authMethod });

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
 *              RUTAS DE EDICIÓN DE POSTS CON DEBUGGING
 ******************************************************/

// Obtener post para edición - CON DEBUGGING EXTENDIDO
app.get('/api/posts/:id/edit', requireAuthHybrid, async (req, res) => {
  try {
    console.log('📝 === SOLICITANDO POST PARA EDICIÓN ===');
    
    const postId = req.params.id;
    
    // Obtener user ID del método de autenticación usado
    let userId;
    if (req.authMethod === 'jwt') {
      userId = req.user.id;
    } else {
      userId = req.session.user ? req.session.user.id : req.user._id;
    }

    console.log('📋 Datos de solicitud:', {
      postId,
      userId,
      authMethod: req.authMethod,
      headers: req.headers
    });

    console.log('🔍 Buscando post en la base de datos...');
    const post = await Post.findById(postId)
      .populate('author', 'username profilePicture');

    if (!post) {
      console.log('❌ Post no encontrado:', postId);
      return res.status(404).json({ 
        success: false,
        error: 'Post no encontrado' 
      });
    }

    console.log('✅ Post encontrado:', {
      id: post._id,
      title: post.title,
      authorId: post.author._id.toString(),
      authorUsername: post.author.username,
      currentUserId: userId
    });

    // Verificar que el usuario es el autor
    if (post.author._id.toString() !== userId.toString()) {
      console.log('❌ Usuario no autorizado para editar este post');
      console.log('   - Autor del post:', post.author._id.toString());
      console.log('   - Usuario actual:', userId.toString());
      console.log('   - ¿Son iguales?', post.author._id.toString() === userId.toString());
      return res.status(403).json({ 
        success: false,
        error: 'No tienes permiso para editar este post' 
      });
    }

    console.log('✅ Usuario autorizado para editar');

    const postData = {
      _id: post._id,
      title: post.title,
      content: post.content,
      tags: post.tags,
      coverImage: post.coverImage,
      published: post.published,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        _id: post.author._id,
        username: post.author.username,
        profilePicture: post.author.profilePicture || '/IMAGENES/default-avatar.png'
      }
    };

    console.log('📤 Enviando datos del post al cliente');
    console.log('📊 Datos del post:', {
      title: postData.title,
      contentLength: postData.content.length,
      tags: postData.tags,
      published: postData.published
    });

    res.json({
      success: true,
      post: postData
    });

  } catch (error) {
    console.error('❌ ERROR AL OBTENER POST PARA EDICIÓN:', error);
    console.error('❌ Stack trace completo:', error.stack);
    
    if (error.name === 'CastError') {
      console.error('❌ Error de casteo - ID inválido:', postId);
      return res.status(400).json({ 
        success: false,
        error: 'ID de post inválido' 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor al obtener el post',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Actualizar post - CON DEBUGGING EXTENDIDO
app.put('/api/posts/:id', requireAuthHybrid, upload.single('coverImage'), async (req, res) => {
  try {
    console.log('✏️ === INICIANDO ACTUALIZACIÓN DE POST ===');
    
    const postId = req.params.id;
    const { title, content, tags, published, removeCoverImage } = req.body;
    
    // Obtener user ID del método de autenticación usado
    let userId;
    if (req.authMethod === 'jwt') {
      userId = req.user.id;
    } else {
      userId = req.session.user ? req.session.user.id : req.user._id;
    }

    console.log('📝 Datos recibidos:', {
      postId,
      userId,
      title: title ? `${title.substring(0, 50)}...` : 'Vacío',
      contentLength: content ? content.length : 0,
      tags: tags || 'No tags',
      published: published || 'false',
      removeCoverImage: removeCoverImage || 'false',
      hasNewCoverImage: !!req.file,
      authMethod: req.authMethod
    });

    // Buscar el post
    console.log('🔍 Buscando post para actualizar...');
    const post = await Post.findById(postId);
    if (!post) {
      console.log('❌ Post no encontrado:', postId);
      return res.status(404).json({ 
        success: false,
        error: 'Post no encontrado' 
      });
    }

    console.log('✅ Post encontrado:', {
      id: post._id,
      title: post.title,
      author: post.author.toString()
    });

    // Verificar que el usuario es el autor
    if (post.author.toString() !== userId.toString()) {
      console.log('❌ Usuario no autorizado para editar este post');
      console.log('   - Autor del post:', post.author.toString());
      console.log('   - Usuario actual:', userId.toString());
      console.log('   - ¿Son iguales?', post.author.toString() === userId.toString());
      return res.status(403).json({ 
        success: false,
        error: 'No tienes permiso para editar este post' 
      });
    }

    console.log('✅ Usuario autorizado, validando datos...');

    // Validaciones
    if (!title || !title.trim()) {
      console.log('❌ Validación fallida: título vacío');
      return res.status(400).json({
        success: false,
        error: 'El título del post es requerido'
      });
    }

    if (!content || !content.trim()) {
      console.log('❌ Validación fallida: contenido vacío');
      return res.status(400).json({
        success: false,
        error: 'El contenido del post es requerido'
      });
    }

    if (title.length > 200) {
      console.log('❌ Validación fallida: título muy largo');
      return res.status(400).json({
        success: false,
        error: 'El título no puede tener más de 200 caracteres'
      });
    }

    // Procesar tags
    let tagsArray = [];
    if (tags && tags.trim()) {
      tagsArray = tags.split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .slice(0, 4);
    }

    console.log('🏷️ Tags procesados:', tagsArray);

    // Preparar datos de actualización
    const updateData = {
      title: title.trim(),
      content: content.trim(),
      tags: tagsArray,
      published: published === 'true'
    };

    // Manejar imagen de portada
    if (removeCoverImage === 'true') {
      updateData.coverImage = null;
      console.log('🗑️ Imagen de portada removida');
    } else if (req.file) {
      updateData.coverImage = `/uploads/${req.file.filename}`;
      console.log('🖼️ Nueva imagen de portada:', updateData.coverImage);
    }

    console.log('📦 Datos de actualización:', updateData);

    // Actualizar el post usando el método del modelo
    post.updatePost(updateData);
    await post.save();
    await post.populate('author', 'username profilePicture');

    console.log('✅ Post actualizado exitosamente - ID:', post._id);
    console.log('📊 Post actualizado:', {
      title: post.title,
      published: post.published,
      tags: post.tags,
      coverImage: post.coverImage
    });

    res.json({
      success: true,
      message: published === 'true' ? '🎉 Post actualizado y publicado exitosamente' : '💾 Post actualizado como borrador',
      post: {
        id: post._id,
        title: post.title,
        content: post.content,
        tags: post.tags,
        coverImage: post.coverImage,
        published: post.published,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt,
        author: post.author
      }
    });

  } catch (error) {
    console.error('❌ ERROR AL ACTUALIZAR POST:', error);
    console.error('❌ Stack trace completo:', error.stack);
    
    if (error.name === 'ValidationError') {
      console.error('❌ Error de validación:', error.message);
      return res.status(400).json({
        success: false,
        error: 'Datos del post inválidos',
        details: Object.values(error.errors).map(e => e.message)
      });
    }

    if (error.name === 'CastError') {
      console.error('❌ Error de casteo - ID inválido:', postId);
      return res.status(400).json({ 
        success: false,
        error: 'ID de post inválido' 
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al actualizar el post',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/******************************************************
 *              ELIMINAR POST
 ******************************************************/
app.delete('/api/posts/:id', requireAuthHybrid, async (req, res) => {
    try {
        console.log('🗑️ === INICIANDO ELIMINACIÓN DE POST ===');
        
        const postId = req.params.id;
        
        // Obtener user ID del método de autenticación usado
        let userId;
        if (req.authMethod === 'jwt') {
            userId = req.user.id;
        } else {
            userId = req.session.user ? req.session.user.id : req.user._id;
        }

        console.log('📝 Datos de eliminación:', {
            postId,
            userId,
            authMethod: req.authMethod
        });

        // Buscar el post
        const post = await Post.findById(postId);
        if (!post) {
            console.log('❌ Post no encontrado:', postId);
            return res.status(404).json({ 
                success: false,
                error: 'Post not found' 
            });
        }

        // Verificar que el usuario es el autor
        if (post.author.toString() !== userId.toString()) {
            console.log('❌ Usuario no autorizado para eliminar este post');
            console.log('   - Autor del post:', post.author.toString());
            console.log('   - Usuario actual:', userId.toString());
            return res.status(403).json({ 
                success: false,
                error: 'Not authorized to delete this post' 
            });
        }

        console.log('✅ Usuario autorizado, eliminando post...');

        // Eliminar el post de la base de datos
        await Post.findByIdAndDelete(postId);
        console.log('✅ Post eliminado de la base de datos');

        // También eliminar comentarios asociados (opcional pero recomendado)
        await Post.updateMany(
            { 'comments.postId': postId },
            { $pull: { comments: { postId: postId } } }
        );
        console.log('✅ Comentarios asociados eliminados');

        res.json({ 
            success: true, 
            message: 'Post deleted successfully' 
        });

    } catch (error) {
        console.error('❌ ERROR AL ELIMINAR POST:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                success: false,
                error: 'ID de post inválido' 
            });
        }

        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor al eliminar el post',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/******************************************************
 *              CIERRE DE SESIÓN
 ******************************************************/
app.get('/logout', (req, res) => {
    console.log('🚪 Cerrando sesión para usuario:', req.session.user?.username);
    
    req.logout(function(err) {
        if (err) {
            console.error('❌ Error en req.logout:', err);
        }
        
        req.session.destroy(function(err) {
            if (err) {
                console.error('❌ Error al destruir sesión:', err);
                return res.status(500).json({ 
                    success: false,
                    error: 'Error al cerrar sesión' 
                });
            }
            
            res.clearCookie('connect.sid');
            console.log('✅ Sesión cerrada exitosamente');
            res.json({
                success: true,
                message: 'Sesión cerrada exitosamente',
                redirect: '/'
            });
        });
    });
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
    console.log('🔐 Endpoints JWT disponibles:');
    console.log('   POST /authenticate');
    console.log('   GET  /api/auth/verify');
    console.log('   POST /api/auth/refresh');
    console.log('   POST /api/auth/logout');
    console.log('💬 Endpoints de comentarios disponibles:');
    console.log('   POST /api/posts/:id/comments');
    console.log('   GET  /api/posts/:id/comments');
    console.log('   PUT  /api/comments/:id');
    console.log('   DELETE /api/comments/:id');
    console.log('📝 Endpoints de posts disponibles:');
    console.log('   GET  /api/posts/:id/edit');
    console.log('   PUT  /api/posts/:id');
    console.log('   DELETE /api/posts/:id');
});

module.exports = app;