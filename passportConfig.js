/******************************************************
 *          CONFIGURACION DE AUTENTICACION 
 ******************************************************/
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('./public/user');

/******************************************************
 *             ESTRATEGIA DE FACEBOOK
 ******************************************************/
passport.use(new FacebookStrategy({
    clientID: '809453415265716',
    clientSecret: '464f18d7f4cdd7ea56879fdcbcd10d2d',
    callbackURL: "http://localhost:3000/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
    enableProof: false,
    passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
    try {
        console.log('🔵 Facebook Profile recibido:', profile);
        
        let user = await User.findOne({ facebookId: profile.id });

        if (!user) {
            if (profile.emails && profile.emails[0]) {
                user = await User.findOne({ email: profile.emails[0].value });
            }

            if (!user) {
                const baseUsername = profile.displayName || 
                                   `${profile.name?.givenName || 'user'}${profile.name?.familyName || ''}`;
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
                    email: profile.emails?.[0]?.value || `${username}@facebook.com`,
                    profilePicture: profile.photos?.[0]?.value || '/IMAGENES/default-avatar.png',
                    displayName: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`,
                    authProvider: 'Facebook'
                });
                
                await user.save();
                console.log('✅ Nuevo usuario de Facebook creado:', user.username);
            } else {
                user.facebookId = profile.id;
                user.authProvider = 'Facebook';
                await user.save();
                console.log('✅ Usuario existente vinculado con Facebook:', user.username);
            }
        }

        // 🔥 GENERAR Y GUARDAR TOKEN JWT
        const token = await user.generateAuthToken('facebook');
        console.log('🔑 Token JWT generado y guardado en BD:', token);

        console.log('✅ Usuario retornado por Facebook strategy:', user);
        return done(null, user);
    } catch (err) {
        console.error('❌ Error en Facebook Strategy:', err);
        return done(err, null);
    }
}));


/******************************************************
 *             ESTRATEGIA DE GOOGLE 
 ******************************************************/
passport.use(new GoogleStrategy({
    clientID: '326743051749-rkvj819e71mhkc2iifqt6dnjcnu2ssrg.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: '/auth/google/callback',
    passReqToCallback: true
}, 
async (req, accessToken, refreshToken, profile, done) => {
    try {
        console.log('🔵 Google Profile recibido:', profile);
        
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            if (profile.emails && profile.emails[0]) {
                user = await User.findOne({ email: profile.emails[0].value });
            }

            if (!user) {
                user = new User({
                    username: profile.displayName,
                    email: profile.emails?.[0]?.value || `${profile.displayName.replace(/\s+/g, '')}@gmail.com`,
                    googleId: profile.id,
                    profilePicture: profile.photos[0].value,
                    authProvider: 'Google'
                });
                await user.save();
                console.log('✅ Nuevo usuario de Google creado:', user.username);
            } else {
                user.googleId = profile.id;
                user.authProvider = 'Google';
                await user.save();
                console.log('✅ Usuario existente vinculado con Google:', user.username);
            }
        } else {
            if (!user.authProvider) {
                user.authProvider = 'Google';
                await user.save();
            }
        }

        // 🔥 GENERAR Y GUARDAR TOKEN JWT
        const token = await user.generateAuthToken('google');
        console.log('🔑 Token JWT generado y guardado en BD:', token);

        console.log('✅ Usuario retornado por Google strategy:', user);
        return done(null, user);
    } catch (err) {
        console.error('❌ Error en Google Strategy:', err);
        return done(err, null);
    }
}));


/******************************************************
 *             ESTRATEGIA DE GITHUB 
 ******************************************************/
passport.use(new GitHubStrategy({
    clientID: 'Ov23lieYzKQaz5axfnd1',
    clientSecret: 'ca52c7c433b0c2436e319fd4a1668492d142f2a0',
    callbackURL: 'http://localhost:3000/auth/github/callback',
    passReqToCallback: true
}, 
async (req, accessToken, refreshToken, profile, done) => {
    try {
        console.log('🔵 GitHub Profile recibido:', profile);
        
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
            user = await User.findOne({ username: profile.username });
            
            if (!user) {
                user = new User({
                    username: profile.username,
                    email: profile.emails?.[0]?.value || `${profile.username}@github.com`,
                    profilePicture: profile.photos?.[0]?.value || '/IMAGENES/default-avatar.png',
                    githubId: profile.id,
                    authProvider: 'GitHub'
                });
                await user.save();
                console.log('✅ Nuevo usuario de GitHub creado:', user.username);
            } else {
                user.githubId = profile.id;
                user.authProvider = 'GitHub';
                await user.save();
                console.log('✅ Usuario existente vinculado con GitHub:', user.username);
            }
        } else {
            if (!user.authProvider) {
                user.authProvider = 'GitHub';
                await user.save();
            }
        }

        // 🔥 GENERAR Y GUARDAR TOKEN JWT
        const token = await user.generateAuthToken('github');
        console.log('🔑 Token JWT generado y guardado en BD:', token);

        console.log('✅ Usuario retornado por GitHub strategy:', user);
        return done(null, user);
    } catch (err) {
        console.error('❌ Error en GitHub Strategy:', err);
        return done(err, null);
    }
}));


/******************************************************
 *       SERIALIZACION Y DESERIALIZACION
 ******************************************************/
passport.serializeUser((user, done) => {
    console.log('🔵 Serializando usuario ID:', user._id);
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        console.log('🔵 Deserializando usuario ID:', id);
        const user = await User.findById(id);
        if (!user) {
            console.error('❌ Usuario no encontrado. ID recibido:', id);
            const allUsers = await User.find({});
            console.log('📋 Usuarios actuales en BD:', allUsers.map(u => u._id));
            return done(new Error('Usuario no encontrado'), null);
        }
        done(null, user);
    } catch (err) {
        console.error('❌ Error en deserializeUser:', err);
        done(err, null);
    }
});

module.exports = passport;
