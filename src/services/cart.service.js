// src/services/cart.service.js
import mongoose from "mongoose";
import CartDAO from "../dao/cart.dao.js";
import Producto from "../models/producto.model.js"; // para validar existencia/stock

const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const ALLOWED_STATUS = ["activo", "comprado", "cancelado"]; // ajustá si querés

export default class CartService {
  constructor(dao = new CartDAO()) {
    this.dao = dao;
  }

  async list() {
    return await this.dao.findAll();
  }

  async getById(id, opts) {
    const cart = await this.dao.findById(id, opts);
    if (!cart) {
      const e = new Error("Carrito no encontrado");
      e.status = 404;
      throw e;
    }
    return cart;
  }

  async create() {
    return await this.dao.create();
  }

  async addProduct(cartId, productId, qty) {
    if (!isObjectId(cartId) || !isObjectId(productId)) {
      const e = new Error("ID inválido");
      e.status = 400;
      throw e;
    }
    if (typeof qty !== "number" || qty <= 0) {
      const e = new Error("La cantidad debe ser un número mayor a 0");
      e.status = 400;
      throw e;
    }

    // validar producto y stock
    const prod = await Producto.findById(productId).lean();
    if (!prod) {
      const e = new Error("Producto no encontrado");
      e.status = 404;
      throw e;
    }
    if (!prod.status || prod.stock < qty) {
      const e = new Error("No hay suficiente stock");
      e.status = 400;
      throw e;
    }

    const updated = await this.dao.addProduct(cartId, productId, qty);
    if (!updated) {
      const e = new Error("Carrito no encontrado");
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async removeProduct(cartId, productId) {
    if (!isObjectId(cartId) || !isObjectId(productId)) {
      const e = new Error("ID inválido");
      e.status = 400;
      throw e;
    }
    const res = await this.dao.removeProduct(cartId, productId);
    if (res === null) {
      const e = new Error("Carrito no encontrado");
      e.status = 404;
      throw e;
    }
    if (res === undefined) {
      const e = new Error("Producto no encontrado en el carrito");
      e.status = 404;
      throw e;
    }
    return res;
  }

  async clear(cartId) {
    const updated = await this.dao.clearProducts(cartId);
    if (!updated) {
      const e = new Error("Carrito no encontrado");
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async replaceProducts(cartId, products) {
    if (!Array.isArray(products) || products.length === 0) {
      const e = new Error("Debe enviar una lista de productos");
      e.status = 400;
      throw e;
    }

    // validar shape, ids y cantidades
    for (const p of products) {
      if (!isObjectId(p.product)) {
        const e = new Error("ID de producto inválido");
        e.status = 400;
        throw e;
      }
      if (typeof p.quantity !== "number" || p.quantity <= 0) {
        const e = new Error("La cantidad debe ser mayor a 0");
        e.status = 400;
        throw e;
      }
      // validar existencia (opcionalmente stock total, aquí omitimos sumar por simplicidad)
      const exists = await Producto.exists({ _id: p.product });
      if (!exists) {
        const e = new Error("Producto no encontrado");
        e.status = 404;
        throw e;
      }
    }

    const updated = await this.dao.replaceProducts(cartId, products);
    if (!updated) {
      const e = new Error("Carrito no encontrado");
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async updateQuantity(cartId, productId, quantity) {
    if (!isObjectId(cartId) || !isObjectId(productId)) {
      const e = new Error("ID inválido");
      e.status = 400;
      throw e;
    }
    if (typeof quantity !== "number") {
      const e = new Error("La cantidad debe ser un número");
      e.status = 400;
      throw e;
    }
    if (quantity > 0) {
      const prod = await Producto.findById(productId).lean();
      if (!prod) {
        const e = new Error("Producto no encontrado");
        e.status = 404;
        throw e;
      }
      if (!prod.status || prod.stock < quantity) {
        const e = new Error("No hay suficiente stock");
        e.status = 400;
        throw e;
      }
    }

    const res = await this.dao.updateQuantity(cartId, productId, quantity);
    if (res === null) {
      const e = new Error("Carrito no encontrado");
      e.status = 404;
      throw e;
    }
    if (res === undefined) {
      const e = new Error("Producto no encontrado en el carrito");
      e.status = 404;
      throw e;
    }
    return res;
  }

  async updateStatus(cartId, status) {
    if (!ALLOWED_STATUS.includes(status)) {
      const e = new Error(`Estado inválido. Valores permitidos: ${ALLOWED_STATUS.join(", ")}`);
      e.status = 400;
      throw e;
    }
    const updated = await this.dao.updateStatus(cartId, status);
    if (!updated) {
      const e = new Error("Carrito no encontrado");
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async totals(cartId) {
    // valida existencia del carrito primero
    const exists = await this.dao.findById(cartId);
    if (!exists) {
      const e = new Error("Carrito no encontrado");
      e.status = 404;
      throw e;
    }
    return await this.dao.calculateTotals(cartId);
  }
}
