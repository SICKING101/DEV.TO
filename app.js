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
const app = express();

/******************************************************
 *             CONFIGURACIÓN DE MIDDLEWARES
 ******************************************************/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Configuración de sesiones MEJORADA
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
    console.log('🔵 Ruta / - Sesión:', req.session.user, 'Autenticado Passport:', req.isAuthenticated());
    if (req.session.user || req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, 'public', 'PAGINA', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'Login.html'));
    }
});

app.get('/index', (req, res) => {
    console.log('🔵 Ruta /index - Sesión:', req.session.user);
    res.sendFile(path.join(__dirname, 'public', 'PAGINA', 'index.html'));
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
 *              CIERRE DE SESIÓN (COMPLETAMENTE CORREGIDO)
 ******************************************************/
app.get('/logout', (req, res) => {
    console.log('🔵 Iniciando logout completo...');
    
    // 1. Cerrar sesión de Passport PRIMERO
    req.logout(function(err) {
        if (err) {
            console.error('❌ Error en req.logout:', err);
        }
        console.log('✅ Passport logout completado');
        
        // 2. Destruir la sesión de Express
        req.session.destroy(function(err) {
            if (err) {
                console.error('❌ Error al destruir sesión:', err);
                return res.status(500).send('Error al cerrar sesión');
            }
            console.log('✅ Sesión Express destruida');
            
            // 3. Limpiar la cookie de sesión
            res.clearCookie('connect.sid');
            console.log('✅ Cookie limpiada');
            
            // 4. Redirigir al login
            res.redirect('/');
        });
    });
});

/******************************************************
 *         RUTA PARA OBTENER DATOS DEL USUARIO (CORREGIDA)
 ******************************************************/
app.get('/api/user', (req, res) => {
    console.log('🔵 /api/user - Sesión:', req.session.user, 'Autenticado Passport:', req.isAuthenticated());
    
    // PRIORIDAD 1: Usuario en sesión Express
    if (req.session.user) {
        console.log('✅ Retornando usuario de sesión Express');
        return res.json({ user: req.session.user });
    }
    
    // PRIORIDAD 2: Usuario autenticado con Passport
    if (req.isAuthenticated() && req.user) {
        console.log('✅ Retornando usuario de Passport');
        const userData = {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email || `${req.user.username}@devcommunity.com`,
            profilePicture: req.user.profilePicture || '/IMAGENES/default-avatar.png',
            authProvider: req.user.authProvider || 'OAuth'
        };
        
        // Sincronizar con sesión Express para consistencia
        req.session.user = userData;
        
        return res.json({ user: userData });
    }
    
    // PRIORIDAD 3: No autenticado
    console.log('❌ Usuario no autenticado');
    res.json({ user: null });
});

/******************************************************
 *        AUTENTICACIÓN CON GOOGLE (COMPLETAMENTE CORREGIDA)
 ******************************************************/
app.get('/auth/google',
    (req, res, next) => {
        console.log('🔵 Iniciando autenticación Google...');
        next();
    },
    passport.authenticate('google', { 
        scope: ['profile', 'email']
    })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { 
        failureRedirect: '/Login.html'
    }),
    (req, res) => {
        console.log('🔵 Autenticación Google exitosa, usuario:', req.user);
        
        if (!req.user) {
            console.error('❌ No hay objeto usuario después de Google auth');
            return res.redirect('/Login.html');
        }

        const userSessionData = {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email || `${req.user.username}@gmail.com`,
            profilePicture: req.user.profilePicture || '/IMAGENES/default-avatar.png',
            authProvider: 'Google'
        };

        console.log('🔵 Configurando sesión para Google:', userSessionData);
        
        // Guardar en sesión Express
        req.session.user = userSessionData;
        
        // Redirigir con parámetro para que el frontend detecte el login
        res.redirect('/index?oauth=google&t=' + Date.now());
    }
);

/******************************************************
 *        AUTENTICACIÓN CON FACEBOOK (COMPLETAMENTE CORREGIDA)
 ******************************************************/
app.get('/auth/facebook', 
    (req, res, next) => {
        console.log('🔵 Iniciando autenticación Facebook...');
        next();
    },
    passport.authenticate('facebook', { 
        scope: ['email', 'public_profile']
    })
);

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { 
        failureRedirect: '/Login.html'
    }),
    (req, res) => {
        console.log('🔵 Autenticación Facebook exitosa, usuario:', req.user);
        
        if (!req.user) {
            console.error('❌ No hay objeto usuario después de Facebook auth');
            return res.redirect('/Login.html');
        }

        const userSessionData = {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email || `${req.user.username}@facebook.com`,
            profilePicture: req.user.profilePicture || '/IMAGENES/default-avatar.png',
            authProvider: 'Facebook'
        };

        console.log('🔵 Configurando sesión para Facebook:', userSessionData);
        
        // Guardar en sesión Express
        req.session.user = userSessionData;
        
        // Redirigir con parámetro para que el frontend detecte el login
        res.redirect('/index?oauth=facebook&t=' + Date.now());
    }
);

/******************************************************
 *        AUTENTICACIÓN CON GITHUB (COMPLETAMENTE CORREGIDA)
 ******************************************************/
app.get('/auth/github',
    (req, res, next) => {
        console.log('🔵 Iniciando autenticación GitHub...');
        next();
    },
    passport.authenticate('github', { 
        scope: ['user:email']
    })
);

app.get('/auth/github/callback',
    passport.authenticate('github', { 
        failureRedirect: '/Login.html'
    }),
    (req, res) => {
        console.log('🔵 Autenticación GitHub exitosa, usuario:', req.user);
        
        if (!req.user) {
            console.error('❌ No hay objeto usuario después de GitHub auth');
            return res.redirect('/Login.html');
        }

        const userSessionData = {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email || `${req.user.username}@github.com`,
            profilePicture: req.user.profilePicture || '/IMAGENES/default-avatar.png',
            authProvider: 'GitHub'
        };

        console.log('🔵 Configurando sesión para GitHub:', userSessionData);
        
        // Guardar en sesión Express
        req.session.user = userSessionData;
        
        // Redirigir con parámetro para que el frontend detecte el login
        res.redirect('/index?oauth=github&t=' + Date.now());
    }
);

/******************************************************
 *              INICIO DEL SERVIDOR
 ******************************************************/
app.listen(3000, () => {
    console.log('🚀 Servidor iniciado en el puerto 3000');
    console.log('📱 URLs de autenticación:');
    console.log('   🔵 Facebook: http://localhost:3000/auth/facebook');
    console.log('   🔵 Google: http://localhost:3000/auth/google');
    console.log('   🔵 GitHub: http://localhost:3000/auth/github');
});

module.exports = app;