import passport from "passport";
import passportJWT from "passport-jwt";
import local from "passport-local";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
const buscarToken = (req) => {
  let token = null;

  if (req.cookies.cookieToken) token = req.cookies.cookieToken;

  return token;
};

export const iniciarPassport = () => {
  passport.use(
    "current",
    new passportJWT.Strategy(
      {
        secretOrKey: process.env.JWT_SECRET,
        jwtFromRequest: passportJWT.ExtractJwt.fromExtractors([buscarToken]),
      },
      async (contenidoToken, done) => {
        try {
          return done(null, contenidoToken);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(
    "login",
    new local.Strategy(
      {
        usernameField: "email",
      },
      async (username, password, done) => {
        try {
          const user = await User.findOne({ email: username }).lean();
          if (!user) {
            // Usuario no encontrado
            return done(null, false, { message: "Usuario/Contraseña incorrectos" });
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            // Contraseña incorrecta
            return done(null, false, { message: "Usuario/Contraseña incorrectos" });
          }

          delete user.password;
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};
