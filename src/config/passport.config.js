import passport from "passport";
import passportJWT from "passport-jwt";
import local from "passport-local";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import UserManager from "../managers/userManagerMongo.js";
const userManager = new UserManager();
const buscarToken = (req) => {
  let token = null;

  if (req.cookies.cookieToken) token = req.cookies.cookieToken;

  return token;
};

export const iniciarPassport = () => {
  passport.use(
    "registro",
    new local.Strategy(
      {
        usernameField: "email",
        passReqToCallback: true,
      },
      async function (req, username, password, done) {
        try {
          const { first_name, last_name, age } = req.body;
          if (!first_name || !last_name || !username || !password || !age) {
            return done(null, false, { message: "Todos los campos son obligatorios" });
          }

          const exists = await userManager.findByEmail(username);
          if (exists) {
            return done(null, false, { message: `El usuario con email ${username} ya existe` });
          }
          const nuevoUsuario = await userManager.createUser({
            first_name,
            last_name,
            email: username,
            password,
            age,
          });

          return done(null, nuevoUsuario);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

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
        passReqToCallback: true,
      },
      async (req, username, password, done) => {
        try {
          const { email, password } = req.body;

          const user = await User.findOne({ email }).lean();
          if (!user) {
            // Usuario no encontrado
            return done(null, false, { message: "Usuario/Contraseña incorrectos" });
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
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
