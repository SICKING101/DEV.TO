const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./public/user'); // tu modelo de usuario

passport.use(new GoogleStrategy({
    clientID: '326743051749-rkvj819e71mhkc2iifqt6dnjcnu2ssrg.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            user = new User({
                username: profile.displayName,
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

// Serializar el usuario en la sesión
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserializar el usuario
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
