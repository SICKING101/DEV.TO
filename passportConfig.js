/******************************************************
 * SECCIÓN 1: IMPORTACIÓN DE DEPENDENCIAS Y MÓDULOS
 ******************************************************/

// Framework de autenticación para Node.js
const passport = require('passport');

// Estrategia de autenticación con Facebook
const FacebookStrategy = require('passport-facebook').Strategy;

// Estrategia de autenticación con Google OAuth 2.0
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Estrategia de autenticación con GitHub OAuth
const GitHubStrategy = require('passport-github2').Strategy;

// Modelo de usuario para interactuar con la base de datos
const User = require('./public/user');

/******************************************************
 * SECCIÓN 2: ESTRATEGIA DE AUTENTICACIÓN CON FACEBOOK
 ******************************************************/

/*
 * Configuración y implementación de la estrategia de Facebook
 * Esta estrategia permite a los usuarios autenticarse usando sus cuentas de Facebook
 */
passport.use(new FacebookStrategy({
    // Credenciales de la aplicación Facebook Developer
    clientID: '809453415265716',                    // ID único de la aplicación en Facebook
    clientSecret: '464f18d7f4cdd7ea56879fdcbcd10d2d', // Clave secreta de la aplicación
    callbackURL: "http://localhost:3000/auth/facebook/callback", // URL de redirección después de la autenticación
    profileFields: ['id', 'emails', 'name', 'displayName', 'photos'], // Campos del perfil a solicitar
    enableProof: false,                             // Deshabilita la verificación de proof para desarrollo
    passReqToCallback: true                         // Pasa el objeto request al callback
},
/**
 * Función callback que se ejecuta después de que Facebook autentica al usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {string} accessToken - Token de acceso de Facebook para API calls
 * @param {string} refreshToken - Token para renovar el access token (no siempre disponible)
 * @param {Object} profile - Perfil del usuario con información de Facebook
 * @param {Function} done - Función callback de Passport para completar la autenticación
 */
async (req, accessToken, refreshToken, profile, done) => {
    try {
        // Log para debugging - muestra el perfil recibido de Facebook
        console.log('🔵 Facebook Profile recibido:', profile);
        
        // Buscar usuario por su ID de Facebook
        let user = await User.findOne({ facebookId: profile.id });

        // Si no existe usuario con ese Facebook ID
        if (!user) {
            // Verificar si existe un usuario con el mismo email (para vincular cuentas)
            if (profile.emails && profile.emails[0]) {
                user = await User.findOne({ email: profile.emails[0].value });
            }

            // Si no existe usuario con el email, crear uno nuevo
            if (!user) {
                // Generar nombre de usuario a partir del display name o nombre completo
                const baseUsername = profile.displayName || 
                                   `${profile.name?.givenName || 'user'}${profile.name?.familyName || ''}`;
                let username = baseUsername.replace(/\s+/g, '').toLowerCase();
                
                // Verificar si el username ya existe y generar uno único si es necesario
                let usernameExists = await User.findOne({ username });
                let counter = 1;
                
                while (usernameExists) {
                    username = `${baseUsername.replace(/\s+/g, '').toLowerCase()}${counter}`;
                    usernameExists = await User.findOne({ username });
                    counter++;
                }

                // Crear nuevo usuario con los datos de Facebook
                user = new User({
                    facebookId: profile.id,                    // ID único de Facebook
                    username: username,                        // Nombre de usuario único
                    email: profile.emails?.[0]?.value || `${username}@facebook.com`, // Email o uno generado
                    profilePicture: profile.photos?.[0]?.value || '/IMAGENES/default-avatar.png', // Foto o default
                    displayName: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`, // Nombre para mostrar
                    authProvider: 'Facebook'                   // Proveedor de autenticación
                });
                
                // Guardar el nuevo usuario en la base de datos
                await user.save();
                console.log('✅ Nuevo usuario de Facebook creado:', user.username);
            } else {
                // Vincular cuenta existente con Facebook
                user.facebookId = profile.id;
                user.authProvider = 'Facebook';
                await user.save();
                console.log('✅ Usuario existente vinculado con Facebook:', user.username);
            }
        }

        // 🔥 GENERAR Y GUARDAR TOKEN JWT para autenticación posterior
        const token = await user.generateAuthToken('facebook');
        console.log('🔑 Token JWT generado y guardado en BD:', token);

        // Retornar usuario autenticado a Passport
        console.log('✅ Usuario retornado por Facebook strategy:', user);
        return done(null, user);
    } catch (err) {
        // Manejo de errores durante el proceso de autenticación
        console.error('❌ Error en Facebook Strategy:', err);
        return done(err, null);
    }
}));

/******************************************************
 * SECCIÓN 3: ESTRATEGIA DE AUTENTICACIÓN CON GOOGLE
 ******************************************************/

/*
 * Configuración y implementación de la estrategia de Google OAuth 2.0
 * Esta estrategia permite a los usuarios autenticarse usando sus cuentas de Google
 */
passport.use(new GoogleStrategy({
    // Credenciales de Google Cloud Console
    clientID: '326743051749-rkvj819e71mhkc2iifqt6dnjcnu2ssrg.apps.googleusercontent.com', // ID del cliente OAuth
    clientSecret: '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', // Secreto del cliente OAuth
    callbackURL: '/auth/google/callback',                 // URL de redirección
    passReqToCallback: true                              // Pasar objeto request al callback
}, 
/**
 * Función callback que se ejecuta después de que Google autentica al usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {string} accessToken - Token de acceso de Google para API calls
 * @param {string} refreshToken - Token para renovar el access token
 * @param {Object} profile - Perfil del usuario con información de Google
 * @param {Function} done - Función callback de Passport
 */
async (req, accessToken, refreshToken, profile, done) => {
    try {
        // Log para debugging - muestra el perfil recibido de Google
        console.log('🔵 Google Profile recibido:', profile);
        
        // Buscar usuario por su ID de Google
        let user = await User.findOne({ googleId: profile.id });

        // Si no existe usuario con ese Google ID
        if (!user) {
            // Verificar si existe usuario con el mismo email
            if (profile.emails && profile.emails[0]) {
                user = await User.findOne({ email: profile.emails[0].value });
            }

            // Si no existe usuario, crear uno nuevo
            if (!user) {
                user = new User({
                    username: profile.displayName,                          // Usar display name como username
                    email: profile.emails?.[0]?.value || `${profile.displayName.replace(/\s+/g, '')}@gmail.com`, // Email o generado
                    googleId: profile.id,                                   // ID único de Google
                    profilePicture: profile.photos[0].value,                // Foto de perfil de Google
                    authProvider: 'Google'                                  // Proveedor de autenticación
                });
                await user.save();
                console.log('✅ Nuevo usuario de Google creado:', user.username);
            } else {
                // Vincular cuenta existente con Google
                user.googleId = profile.id;
                user.authProvider = 'Google';
                await user.save();
                console.log('✅ Usuario existente vinculado con Google:', user.username);
            }
        } else {
            // Si el usuario existe pero no tiene proveedor, asignarlo
            if (!user.authProvider) {
                user.authProvider = 'Google';
                await user.save();
            }
        }

        // 🔥 GENERAR Y GUARDAR TOKEN JWT para autenticación posterior
        const token = await user.generateAuthToken('google');
        console.log('🔑 Token JWT generado y guardado en BD:', token);

        // Retornar usuario autenticado a Passport
        console.log('✅ Usuario retornado por Google strategy:', user);
        return done(null, user);
    } catch (err) {
        // Manejo de errores durante el proceso de autenticación
        console.error('❌ Error en Google Strategy:', err);
        return done(err, null);
    }
}));

/******************************************************
 * SECCIÓN 4: ESTRATEGIA DE AUTENTICACIÓN CON GITHUB
 ******************************************************/

/*
 * Configuración y implementación de la estrategia de GitHub OAuth
 * Esta estrategia permite a los usuarios autenticarse usando sus cuentas de GitHub
 */
passport.use(new GitHubStrategy({
    // Credenciales de GitHub OAuth App
    clientID: 'Ov23lieYzKQaz5axfnd1',                    // ID del cliente OAuth de GitHub
    clientSecret: 'ca52c7c433b0c2436e319fd4a1668492d142f2a0', // Secreto del cliente OAuth
    callbackURL: 'http://localhost:3000/auth/github/callback', // URL de redirección
    passReqToCallback: true                              // Pasar objeto request al callback
}, 
/**
 * Función callback que se ejecuta después de que GitHub autentica al usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {string} accessToken - Token de acceso de GitHub para API calls
 * @param {string} refreshToken - Token para renovar el access token (GitHub no lo provee)
 * @param {Object} profile - Perfil del usuario con información de GitHub
 * @param {Function} done - Función callback de Passport
 */
async (req, accessToken, refreshToken, profile, done) => {
    try {
        // Log para debugging - muestra el perfil recibido de GitHub
        console.log('🔵 GitHub Profile recibido:', profile);
        
        // Buscar usuario por su ID de GitHub
        let user = await User.findOne({ githubId: profile.id });

        // Si no existe usuario con ese GitHub ID
        if (!user) {
            // Buscar usuario por username de GitHub
            user = await User.findOne({ username: profile.username });
            
            // Si no existe usuario, crear uno nuevo
            if (!user) {
                user = new User({
                    username: profile.username,                                    // Username de GitHub
                    email: profile.emails?.[0]?.value || `${profile.username}@github.com`, // Email o generado
                    profilePicture: profile.photos?.[0]?.value || '/IMAGENES/default-avatar.png', // Foto o default
                    githubId: profile.id,                                          // ID único de GitHub
                    authProvider: 'GitHub'                                         // Proveedor de autenticación
                });
                await user.save();
                console.log('✅ Nuevo usuario de GitHub creado:', user.username);
            } else {
                // Vincular cuenta existente con GitHub
                user.githubId = profile.id;
                user.authProvider = 'GitHub';
                await user.save();
                console.log('✅ Usuario existente vinculado con GitHub:', user.username);
            }
        } else {
            // Si el usuario existe pero no tiene proveedor, asignarlo
            if (!user.authProvider) {
                user.authProvider = 'GitHub';
                await user.save();
            }
        }

        // 🔥 GENERAR Y GUARDAR TOKEN JWT para autenticación posterior
        const token = await user.generateAuthToken('github');
        console.log('🔑 Token JWT generado y guardado en BD:', token);

        // Retornar usuario autenticado a Passport
        console.log('✅ Usuario retornado por GitHub strategy:', user);
        return done(null, user);
    } catch (err) {
        // Manejo de errores durante el proceso de autenticación
        console.error('❌ Error en GitHub Strategy:', err);
        return done(err, null);
    }
}));

/******************************************************
 * SECCIÓN 5: SERIALIZACIÓN Y DESERIALIZACIÓN DE USUARIOS
 ******************************************************/

/**
 * Serialización del usuario - Convierte el objeto usuario a un ID para almacenar en la sesión
 * Esta función se llama cuando se inicia sesión para determinar qué datos almacenar en la sesión
 * @param {Object} user - Objeto usuario de Mongoose
 * @param {Function} done - Función callback
 */
passport.serializeUser((user, done) => {
    console.log('🔵 Serializando usuario ID:', user._id);
    // Solo almacenar el ID del usuario en la sesión (más eficiente que almacenar todo el objeto)
    done(null, user._id);
});

/**
 * Deserialización del usuario - Convierte el ID de la sesión de vuelta a un objeto usuario completo
 * Esta función se llama en cada request para cargar el usuario desde la base de datos
 * @param {string} id - ID del usuario almacenado en la sesión
 * @param {Function} done - Función callback
 */
passport.deserializeUser(async (id, done) => {
    try {
        console.log('🔵 Deserializando usuario ID:', id);
        // Buscar usuario por ID en la base de datos
        const user = await User.findById(id);
        
        // Si no se encuentra el usuario, loggear error
        if (!user) {
            console.error('❌ Usuario no encontrado. ID recibido:', id);
            // Debug: mostrar todos los usuarios en la base de datos
            const allUsers = await User.find({});
            console.log('📋 Usuarios actuales en BD:', allUsers.map(u => u._id));
            return done(new Error('Usuario no encontrado'), null);
        }
        
        // Retornar usuario encontrado
        done(null, user);
    } catch (err) {
        // Manejo de errores durante la deserialización
        console.error('❌ Error en deserializeUser:', err);
        done(err, null);
    }
});

/******************************************************
 * SECCIÓN 6: EXPORTACIÓN DEL MÓDULO
 ******************************************************/

// Exportar el objeto passport configurado para usar en la aplicación principal
module.exports = passport;