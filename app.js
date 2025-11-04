const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('./public/user');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

const mongo_url = 'mongodb://localhost/mongo1_curso';

mongoose.connect(mongo_url)
    .then(() => {
        console.log(`Se ha conectado a MongoDb ${mongo_url}`);
    })
    .catch((err) => {
        console.log('Error al conectar a MongoDB:', err);
    });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Login.html'));
});

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validación básica
        if (!username || !password) {
            return res.status(400).send('Usuario y contraseña son requeridos');
        }
        
        if (password.length < 6) {
            return res.status(400).send('La contraseña debe tener al menos 6 caracteres');
        }
        
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('El usuario ya existe');
        }
        
        const user = new User({ // Corregido: User en lugar de user
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
        
        // Validación básica
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
                res.status(200).send('Usuario autenticado correctamente');
            } else {
                res.status(401).send('Usuario y/o contraseña incorrectos');
            }
        });
    } catch (err) {
        console.error('Error en autenticación:', err);
        res.status(500).send('Error al autenticar al usuario');
    }
});

app.listen(3000, () => {
    console.log('Servidor iniciado en el puerto 3000');
});

module.exports = app;