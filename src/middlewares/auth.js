import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  if (!req.headers.authorization) {
    res.setHeader("Content-Type", "application/json");
    return res.status(401).json({ error: `No hay token` });
  }

  let token = req.headers.authorization.split(" ")[1];

  try {
    let usuario = jwt.verify(token, process.env.JWT_SECRET);
    req.user = usuario;
  } catch (error) {
    res.setHeader("Content-Type", "application/json");
    return res.status(401).json({ error: `Error: ${error.message}` });
  }

  next();
};

export const authAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Usuario no autenticado" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Acceso restringido a administradores" });
  }

  next();
};
