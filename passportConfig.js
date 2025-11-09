/******************************************************
 *          CONFIGURACIÓN DE AUTENTICACIÓN 
 ******************************************************/

// Importar dependencias principales
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('./public/user'); // Modelo de usuario

/******************************************************
 *             ESTRATEGIA DE FACEBOOK - CORREGIDA
 ******************************************************/
passport.use(new FacebookStrategy({
    clientID: '809453415265716',
    clientSecret: '464f18d7f4cdd7ea56879fdcbcd10d2d',
    callbackURL: "http://localhost:3000/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
    enableProof: true
},
async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Facebook Profile:', profile);
        
        let user = await User.findOne({ facebookId: profile.id });

        if (!user) {
            // Crear username único
            const baseUsername = profile.displayName || 
                               `${profile.name.givenName}${profile.name.familyName}`;
            let username = baseUsername.replace(/\s+/g, '').toLowerCase();
            let usernameExists = await User.findOne({ username });
            let counter = 1;
            
            while (usernameExists) {
                username = `${baseUsername.replace(/\s+/g, '').toLowerCase()}${counter}`;
                usernameExists = await User.findOne({ username });
                counter++;
            }

            user = new User({
                facebookId: profile.id,
                username: username,
                email: profile.emails?.[0]?.value || null,
                profilePicture: profile.photos?.[0]?.value || '/IMAGENES/default-avatar.png',
                displayName: profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`
            });
            await user.save();
            console.log('Nuevo usuario de Facebook creado:', user.username);
        }

        return done(null, user);
    } catch (err) {
        console.error('Error en Facebook Strategy:', err);
        return done(err, null);
    }
}));

/******************************************************
 *             ESTRATEGIA DE GOOGLE (OAUTH 2.0)
 ******************************************************/
passport.use(new GoogleStrategy({
    clientID: '326743051749-rkvj819e71mhkc2iifqt6dnjcnu2ssrg.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: '/auth/google/callback'
}, 
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            user = new User({
                username: profile.displayName,
                email: profile.emails?.[0]?.value || null,
                googleId: profile.id,
                profilePicture: profile.photos[0].value
            });
            await user.save();
        }

        return done(null, user);

    } catch (err) {
        return done(err, null);
    }
}));

/******************************************************
 *             ESTRATEGIA DE GITHUB
 ******************************************************/
passport.use(new GitHubStrategy({
    clientID: 'Ov23lieYzKQaz5axfnd1',
    clientSecret: 'ca52c7c433b0c2436e319fd4a1668492d142f2a0',
    callbackURL: 'http://localhost:3000/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ username: profile.username });

        if (!user) {
            user = new User({
                username: profile.username,
                email: profile.emails?.[0]?.value || null,
                profilePicture: profile.photos?.[0]?.value || null,
                password: null
            });
            await user.save();
        }

        return done(null, user);
    } catch (err) {
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