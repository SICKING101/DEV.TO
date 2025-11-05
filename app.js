const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('./passportConfig'); // importar configuración de passport
const app = express();

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('./public/user');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Configuración de sesiones
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));

const mongo_url = 'mongodb://localhost/mongo1_curso';

mongoose.connect(mongo_url)
    .then(() => {
        console.log(`Se ha conectado a MongoDb ${mongo_url}`);
    })
    .catch((err) => {
        console.log('Error al conectar a MongoDB:', err);
    });

// Middleware para pasar datos de usuario a las vistas
app.get('/', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'public', 'PAGINA', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'Login.html'));
    }
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'PAGINA', 'index.html'));
});


app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).send('Usuario y contraseña son requeridos');
        }
        
        if (password.length < 6) {
            return res.status(400).send('La contraseña debe tener al menos 6 caracteres');
        }
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('El usuario ya existe');
        }
        
        const user = new User({ 
            username,
            password
        });
        
        await user.save();
        res.status(200).send('Usuario registrado exitosamente');
    } catch (err) {
        console.error('Error al registrar usuario:', err);
        res.status(500).send('Error al registrar usuario');
    }
});

app.post('/authenticate', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).send('Usuario y contraseña son requeridos');
        }
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).send('Usuario y/o contraseña incorrectos');
        }
        
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

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error al cerrar sesión');
        }
        res.redirect('/');
    });
});

app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.json({ user: null });
    }
});

// Ruta para iniciar sesión con Google
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Ruta de callback de Google
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/Login.html' }),
    (req, res) => {
        // Si todo sale bien, guardar usuario en la sesión
        req.session.user = {
            id: req.user._id,
            username: req.user.username,
            profilePicture: req.user.profilePicture
        };
        res.redirect('/index'); // redirige al index o dashboard
    }
);


app.listen(3000, () => {
    console.log('Servidor iniciado en el puerto 3000');
});

module.exports = app;