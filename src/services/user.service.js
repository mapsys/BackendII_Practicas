// src/services/user.service.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Cart from "../models/cart.model.js";
import UserDAO from "../dao/user.dao.js";

const JWT_SECRET = process.env.JWT_SECRET || "coderSecret";
const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

function sanitizeUser(u) {
  if (!u) return u;
  const { password, ...rest } = u;
  return rest;
}

export default class UserService {
  constructor(dao = new UserDAO()) {
    this.dao = dao;
  }

  async register({ first_name, last_name, email, password, age }) {
    // Validaciones mínimas
    const required = { first_name, last_name, email, password, age };
    const missing = Object.entries(required).filter(([, v]) => v == null || v === "");
    if (missing.length) {
      const plural = missing.length > 1;
      const list = new Intl.ListFormat("es-AR", { type: "conjunction" }).format(missing.map(([k]) => k));
      const e = new Error(`${plural ? "Los" : "El"} ${plural ? "campos" : "campo"} ${list} ${plural ? "son" : "es"} obligatorio${plural ? "s" : ""}`);
      e.status = 400;
      throw e;
    }

    const exists = await this.dao.existsByEmail(email);
    if (exists) {
      const e = new Error(`El usuario con email ${email} ya existe`);
      e.status = 400;
      throw e;
    }

    // Crear cart y determinar role
    const newCart = await Cart.create({ products: [] });
    const role = email.toLowerCase().endsWith("@coder.com") ? "admin" : "user";

    // UserSchema hace hash en pre('save')
    const user = await this.dao.create({ first_name, last_name, email, password, age, role, cart: newCart._id });
    return sanitizeUser(user);
  }

  async login({ email, password }) {
    const user = await this.dao.findByEmail(email);
    if (!user) {
      const e = new Error("Usuario/Contraseña incorrectos");
      e.status = 401;
      throw e;
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const e = new Error("Usuario/Contraseña incorrectos");
      e.status = 401;
      throw e;
    }
    const safe = sanitizeUser(user);
    const payload = {
      _id: safe._id,
      email: safe.email,
      role: safe.role,
      first_name: safe.first_name,
      last_name: safe.last_name,
      cart: safe.cart,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    return { user: safe, token };
  }

  async setCart(userId, newCartId) {
    if (!isObjectId(userId) || !isObjectId(newCartId)) {
      const e = new Error("ID inválido");
      e.status = 400;
      throw e;
    }
    const updated = await this.dao.setCart(userId, newCartId);
    if (!updated) {
      const e = new Error("Usuario no encontrado");
      e.status = 404;
      throw e;
    }
    return sanitizeUser(updated);
  }

  async getCurrentFromDB(userId) {
    const user = await this.dao.findById(userId);
    if (!user) {
      const e = new Error("Usuario no encontrado");
      e.status = 404;
      throw e;
    }
    return sanitizeUser(user);
  }
}
