export function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}
export function adminOnly(req, res, next) {
  if (req.session.user?.role !== "admin") {
    return res.status(403).send("Acceso denegado");
  }
  next();
}
