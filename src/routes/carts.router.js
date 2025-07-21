// src/routes/carts.router.js
import { Router } from "express";
import mongoose from "mongoose";
export default function cartsRouter(cartManager, productManager) {
  const router = Router();

  // GETS
  router.get("/:id", async (req, res) => { 
    const { id } = req.params;
    try {
      const cart = await cartManager.getCartById(id);
      res.status(200).json(cart);
    } catch (error) {
      res.status(404).json({ error: "Carrito no encontrado" });
    }
  });

  router.get("/:cid/totales", async (req, res) => {
    const { cid } = req.params;
    try {
      const totales = await cartManager.calcularTotales(cid);
      res.status(200).json(totales);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener los carritos" });
    }
  });

  // POSTS
  router.post("/", async (req, res) => {
    try {
      const newCart = await cartManager.addCart();
      res.status(201).json(newCart);
    } catch {
      res.status(500).json({ error: "Error al crear el carrito en el router" });
    }
  });

  router.post("/:cid/product/:pid", async (req, res) => {
    const { qty } = req.body;
    const { cid, pid } = req.params;

    try {
      await productManager.hasProductStock(pid, qty);
      const cart = await cartManager.addProductToCart(cid, pid, qty);
      res.status(200).json(cart);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  // DELETES
  router.delete("/:cid/product/:pid", async (req, res) => {
    const { cid, pid } = req.params;
    try {
      const cart = await cartManager.deleteProductFromCart(cid, pid);
      res.status(200).json(cart);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  router.delete("/:cid", async (req, res) => {
    const { cid } = req.params;
    if (!mongoose.Types.ObjectId.isValid(cid)) {
      return res.status(400).json({ error: "El ID de carrito no es válido" });
    }
    const products = [];
    try {
      const updatedCart = await cartManager.updatecartProducts(cid, products);
      res.status(200).json(updatedCart);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });
  // PUTS
  router.put("/:cid", async (req, res) => {
    const { cid } = req.params;

    if (!req.body || !Array.isArray(req.body.products)) {
      return res.status(400).json({ error: "Se requiere un campo 'products' con un array válido" });
    }

    const { products } = req.body;

    if (products.length === 0) {
      return res.status(400).json({ error: "El array de productos no puede estar vacío" });
    }

    for (const item of products) {
      if (!item.product || !mongoose.Types.ObjectId.isValid(item.product) || typeof item.quantity !== "number" || item.quantity <= 0) {
        return res.status(400).json({ error: "Formato inválido en alguno de los productos" });
      }
    }

    try {
      const updatedCart = await cartManager.updatecartProducts(cid, products);
      res.status(200).json(updatedCart);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  router.put("/:cid/product/:pid", async (req, res) => {
    const { cid, pid } = req.params;
    if (!req.body) {
      return res.status(400).json({ error: "Se requiere un campo 'qty' con un número mayor a 0" });
    }
    const { qty } = req.body;
    if (typeof qty !== "number" || qty <= 0) {
      return res.status(400).json({ error: "Se requiere un campo 'qty' con un número mayor a 0" });
    }

    try {
      await productManager.hasProductStock(pid, qty);
      const updatedCart = await cartManager.updateProductQty(cid, pid, qty);
      res.status(200).json(updatedCart);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  router.put("/:cid/estado", async (req, res) => {
    const { cid } = req.params;
    if (!req.body) {
      return res.status(400).json({ error: "Se requiere un campo 'estado'" });
    }
    const { estado } = req.body;
    if (typeof estado !== "string" || !["activo", "inactivo", "comprado"].includes(estado)) {
      return res.status(400).json({ error: "El estado debe ser 'activo', 'inactivo' o 'comprado'" });
    }
    try {
      const updatedCart = await cartManager.updateCartStatus(cid, estado);
      res.status(200).json(updatedCart);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  return router;
}
