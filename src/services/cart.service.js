import mongoose from "mongoose";
import CartRepository from "../repositories/cart.repository.js";
import Producto from "../models/producto.model.js"; 

const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const ALLOWED_STATUS = ["activo", "comprado", "cancelado"];

export default class CartService {
  constructor(repo = new CartRepository()) {
    this.repo = repo;
  }

  async list() {
    return await this.repo.findAll();
  }

  async getById(id, opts) {
    const cart = await this.repo.findById(id, opts);
    if (!cart) {
      const e = new Error("Carrito no encontrado");
      e.status = 404;
      throw e;
    }
    return cart;
  }

  async create() {
    return await this.repo.create();
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

    const updated = await this.repo.addProduct(cartId, productId, qty);
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
    const res = await this.repo.removeProduct(cartId, productId);
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
    const updated = await this.repo.clearProducts(cartId);
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
      const exists = await Producto.exists({ _id: p.product });
      if (!exists) {
        const e = new Error("Producto no encontrado");
        e.status = 404;
        throw e;
      }
    }

    const updated = await this.repo.replaceProducts(cartId, products);
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

    const res = await this.repo.updateQuantity(cartId, productId, quantity);
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
    const updated = await this.repo.updateStatus(cartId, status);
    if (!updated) {
      const e = new Error("Carrito no encontrado");
      e.status = 404;
      throw e;
    }
    return updated;
  }

  async totals(cartId) {
    // valida existencia del carrito primero
    const exists = await this.repo.findById(cartId);
    if (!exists) {
      const e = new Error("Carrito no encontrado");
      e.status = 404;
      throw e;
    }
    return await this.repo.calculateTotals(cartId);
  }
}
