// src/controllers/sessions.controller.js
import UserService from "../services/user.service.js";

export default class SessionsController {
  constructor(service = new UserService()) {
    this.service = service;
  }

  // Si usás passportCall("registro"): req.user te lo da la estrategia
  registerFromPassport = async (req, res, next) => {
    try {
      res.json({
        message: `Registro exitoso para ${req.user.first_name || req.user.nombre || req.user.email}`,
        usuarioCreado: req.user,
      });
    } catch (e) { next(e); }
  };

  // Alternativa sin Passport para register:
  registerDirect = async (req, res, next) => {
    try {
      const user = await this.service.register(req.body);
      res.status(201).json({ message: "Registro exitoso", usuarioCreado: user });
    } catch (e) { next(e); }
  };

  // Con passportCall("login") ya tenés req.user; pero firmamos el JWT acá
  loginFromPassport = async (req, res, next) => {
    try {
      // req.user viene "safe" desde la estrategia
      const payload = {
        _id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        cart: req.user.cart,
      };
      const jwt = await this.service.login({ email: payload.email, password: req.body.password })
        .catch(() => ({ token: null, user: req.user })); // si ya validó la strategy, puede omitirse
      const token = jwt?.token ?? require("jsonwebtoken").sign(payload, process.env.JWT_SECRET || "coderSecret", { expiresIn: "1h" });

      res.cookie("cookieToken", token, { httpOnly: true });
      res.status(200).json({ usuarioLogueado: req.user });
    } catch (e) { next(e); }
  };

  // Alternativa sin Passport para login:
  loginDirect = async (req, res, next) => {
    try {
      const { user, token } = await this.service.login(req.body);
      res.cookie("cookieToken", token, { httpOnly: true });
      res.status(200).json({ usuarioLogueado: user });
    } catch (e) { next(e); }
  };

  logout = async (_req, res, _next) => {
    res.clearCookie("cookieToken");
    res.status(200).json({ message: "Sesión cerrada correctamente" });
  };

  setCart = async (req, res, next) => {
    try {
      const updated = await this.service.setCart(req.user._id, req.body.newCartId);
      res.json({ mensaje: "Carrito del usuario actualizado", user: updated });
    } catch (e) { next(e); }
  };

  // Si querés traerlo de DB para tener info fresca:
  current = async (req, res, next) => {
    try {
      const user = await this.service.getCurrentFromDB(req.user._id || req.user.user?._id || req.user.id);
      res.status(200).json({ user });
    } catch (e) { next(e); }
  };

  // Si preferís devolver el token payload sin ir a DB:
  currentFromToken = async (req, res, next) => {
    try {
      res.status(200).json({ user: req.user });
    } catch (e) { next(e); }
  };
}
