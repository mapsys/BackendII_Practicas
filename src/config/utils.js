import { fileURLToPath } from "url";
import { dirname } from "path";
import passport from "passport";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default __dirname;

export const passportCall = (estrategia) =>
  function (req, res, next) {
    passport.authenticate(estrategia, function (err, user, info, status) {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).send({ error: info.message ? info.message : info.toString() });
      }
      req.user = user;
      return next();
    })(req, res, next);
  };
