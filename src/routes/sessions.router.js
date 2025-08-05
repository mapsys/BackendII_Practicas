import { Router } from "express";
import UserManager from "../managers/userManagerMongo.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import passport from "passport";
const JWT_SECRET = process.env.JWT_SECRET || "coderSecret";

export default function usersRouter() {
  const router = Router();
  const userManager = new UserManager();

  router.post("/register", async (req, res) => {
    const { first_name, last_name, email, password, age } = req.body;
    if (!first_name || !last_name || !email || !password || !age) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }
    try {
      console.log("registro user", first_name, last_name, email, password, age);
      const newUser = await userManager.createUser({ first_name, last_name, email, password, age });
      const userName = `${newUser.first_name} ${newUser.last_name}`;
      res.status(200).json({ mensaje: "Usuario registrado con exito" });
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        return res.status(422).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message || "Error interno del servidor" });
    }
  });
  router.post("/login", passport.authenticate("login", { session: false }), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }
    let usuario = req.user;
    delete usuario.password; // borrar datos sensibles antes de generar token
    let token = jwt.sign(usuario, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("cookieToken", token, { httpOnly: true });
    return res.status(200).json({
      usuarioLogueado: usuario,
    });
  });

  router.get("/logout", (req, res) => {
    console.log("logout");
    res.clearCookie("cookieToken");
    res.status(200).json({ message: "Sesión cerrada correctamente" });
  });

  router.put("/cart", passport.authenticate("login", { session: false, failureRedirect: "/error" }), async (req, res) => {
    const userId = req.user._id;
    const { newCartId } = req.body;

    try {
      await User.findByIdAndUpdate(userId, { cart: newCartId });
      res.json({ mensaje: "Carrito del usuario actualizado" });
    } catch (err) {
      res.status(500).json({ error: "No se pudo actualizar el carrito del usuario" });
    }
  });
  router.get("/current", passport.authenticate("current", { session: false }), (req, res) => {
    res.status(200).json({ user: req.user });
  });
  return router;
}
