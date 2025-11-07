/******************************************************
 *          CONFIGURACIÓN DE AUTENTICACIÓN GOOGLE
 ******************************************************/

// Importar dependencias principales
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./public/user'); // Modelo de usuario

/******************************************************
 *             ESTRATEGIA DE GOOGLE (OAUTH 2.0)
 ******************************************************/

passport.use(new GoogleStrategy({
    clientID: '326743051749-rkvj819e71mhkc2iifqt6dnjcnu2ssrg.apps.googleusercontent.com', // ID del cliente de Google Cloud
    clientSecret: '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', // Secreto del cliente
    callbackURL: '/auth/google/callback' // URL de retorno después del login
}, 
// Función que se ejecuta después de que Google autentica al usuario
async (accessToken, refreshToken, profile, done) => {
    try {
        // Buscar si el usuario ya existe en la base de datos
        let user = await User.findOne({ googleId: profile.id });

        // Si no existe, crear uno nuevo con los datos del perfil de Google
        if (!user) {
            user = new User({
                username: profile.displayName,
                googleId: profile.id,
                profilePicture: profile.photos[0].value
            });
            await user.save();
        }

        // Enviar el usuario a la sesión
        return done(null, user);

    } catch (err) {
        // Si ocurre un error durante el proceso
        return done(err, null);
    }
}));

/******************************************************
 *       SERIALIZACIÓN Y DESERIALIZACIÓN DE SESIÓN
 ******************************************************/
// Guardar solo el ID del usuario en la sesión
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Recuperar el usuario completo a partir del ID guardado en la sesión
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

/******************************************************
 *                EXPORTAR CONFIGURACIÓN
 ******************************************************/
module.exports = passport;
