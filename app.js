/******************************************************
 *                IMPORTACIÓN DE MÓDULOS
 ******************************************************/
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('./passportConfig'); // Configuración de Passport (Google)
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('./public/user');
const app = express();

/******************************************************
 *             CONFIGURACIÓN DE MIDDLEWARES
 ******************************************************/
// Analiza cuerpos JSON y formularios
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Configuración de sesiones
app.use(session({
    secret: 'your-secret-key', // Cambiar por una clave segura
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // Expira en 24 horas
}));

// Inicializar Passport (para Google Login)
app.use(passport.initialize());
app.use(passport.session());

// Servir archivos estáticos desde la carpeta "public"
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
// Ruta raíz: redirige según el estado de sesión
app.get('/', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'public', 'PAGINA', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'Login.html'));
    }
});

// Ruta directa al index
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'PAGINA', 'index.html'));
});

/******************************************************
 *              REGISTRO DE USUARIOS
 ******************************************************/
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validaciones básicas
        if (!username || !password)
            return res.status(400).send('Usuario y contraseña son requeridos');

        if (password.length < 6)
            return res.status(400).send('La contraseña debe tener al menos 6 caracteres');

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ username });
        if (existingUser)
            return res.status(400).send('El usuario ya existe');

        // Crear y guardar nuevo usuario
        const user = new User({ username, password });
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

        // Validaciones básicas
        if (!username || !password)
            return res.status(400).send('Usuario y contraseña son requeridos');

        // Buscar usuario
        const user = await User.findOne({ username });
        if (!user)
            return res.status(401).send('Usuario y/o contraseña incorrectos');

        // Verificar contraseña
        user.isCorrectPassword(password, (err, result) => {
            if (err) {
                console.error('Error al verificar contraseña:', err);
                return res.status(500).send('Error al autenticar');
            }

            if (result) {
                // Guardar usuario en sesión
                req.session.user = {
                    id: user._id,
                    username: user.username,
                    profilePicture: user.profilePicture
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
 *              CIERRE DE SESIÓN (LOGOUT)
 ******************************************************/
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err)
            return res.status(500).send('Error al cerrar sesión');
        res.redirect('/');
    });
});

/******************************************************
 *         RUTA PARA OBTENER DATOS DEL USUARIO
 ******************************************************/
app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.json({ user: null });
    }
});

/******************************************************
 *        AUTENTICACIÓN CON GOOGLE (PASSPORT)
 ******************************************************/
// Iniciar sesión con Google
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback de Google después de autenticación
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/Login.html' }),
    (req, res) => {
        // Guardar usuario en sesión
        req.session.user = {
            id: req.user._id,
            username: req.user.username,
            profilePicture: req.user.profilePicture
        };
        res.redirect('/index'); // Redirigir al dashboard o página principal
    }
);

/******************************************************
 *              INICIO DEL SERVIDOR
 ******************************************************/
app.listen(3000, () => {
    console.log('🚀 Servidor iniciado en el puerto 3000');
});

/******************************************************
 *                 EXPORTAR APP 
 ******************************************************/
module.exports = app;
