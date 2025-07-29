import { Router } from "express";
import UserManager from "../managers/userManagerMongo.js";
import mongoose from "mongoose";
import { body, validationResult } from "express-validator";
export default function sessionsRouter() {
  const router = Router();
  const userManager = new UserManager();

  router.post("/register", async (req, res) => {
    const { first_name, last_Name, email, password, age } = req.body;
    if (!first_name || !last_Name || !email || !password || !age) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }
    try {
      const newUser = await userManager.createUser({ first_name, last_Name, email, password, age });
      req.session.user = { _id: newUser._id, name: newUser.name, role: newUser.role };
      res.status(200).json({ mensaje: "Usuario registrado con exito" });
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        return res.status(422).json({ error: err.message });
      }
      /* ⬇️ 2. Otros casos: pasamos al manejador global ------------------- */
      return next(err);
    }
  });
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }
    try {
      const user = await userManager.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }
      const isPasswordValid = await userManager.validateUser(email, password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }
      req.session.user = { _id: user._id, name: user.name, role: user.role };
      res.status(200).json({ mensaje: "Inicio de sesión exitoso" });
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        return res.status(422).json({ error: err.message });
      }
      /* ⬇️ 2. Otros casos: pasamos al manejador global ------------------- */
      return next(err);
    }
  });

  router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "No se pudo cerrar sesión" });

      // Borra la cookie en el navegador
      res.clearCookie("connect.sid");
      // Redirige o renderiza la vista
      res.redirect("/logout"); // si la sirves por router de vistas
    });
  });
  return router;
}
