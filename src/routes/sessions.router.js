import { Router } from "express";
import UserManager from "../managers/userManagerMongo.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import passport from "passport";
import { passportCall } from "../config/utils.js";
const JWT_SECRET = process.env.JWT_SECRET || "coderSecret";

export default function usersRouter() {
  const router = Router();
  const userManager = new UserManager();

  router.post("/register", passportCall("registro"), async (req, res) => {
    res.json({
      message: `Registro existoso para ${req.user.nombre}`,
      usuarioCreado: req.user,
    });
  });

  router.post("/login", passportCall("login"), async (req, res) => {
    const usuario = req.user;
    const token = jwt.sign(usuario, process.env.JWT_SECRET, { expiresIn: "1h" });
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
