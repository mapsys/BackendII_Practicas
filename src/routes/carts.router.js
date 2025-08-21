// src/routes/carts.router.js
import { Router } from "express";
import { passportCall } from "../middlewares/passportCall.js";
import { ensureObjectId } from "../middlewares/ensureObjectId.js";
import CartsController from "../controllers/carts.controller.js";

export default function cartsRouter() {
  const router = Router();
  const controller = new CartsController();
  const auth = passportCall("current");

  router.get("/", auth, controller.list);
  router.post("/", auth, controller.create);

  router.get("/:cid", auth, ensureObjectId("cid"), controller.getOne);

  // Agregar producto (qty en body, default 1)
  router.post("/:cid/products/:pid", auth, ensureObjectId("cid"), ensureObjectId("pid"), controller.addProduct);

  // Reemplazar todo el arreglo de productos
  router.put("/:cid/products", auth, ensureObjectId("cid"), controller.replaceProducts);

  // Actualizar cantidad
  router.put("/:cid/products/:pid", auth, ensureObjectId("cid"), ensureObjectId("pid"), controller.updateQuantity);

  // Eliminar producto del carrito
  router.delete("/:cid/products/:pid", auth, ensureObjectId("cid"), ensureObjectId("pid"), controller.removeProduct);

  // Cambiar estado del carrito
  router.put("/:cid/status", auth, ensureObjectId("cid"), controller.updateStatus);

  // Totales
  router.get("/:cid/totals", auth, ensureObjectId("cid"), controller.totals);

  return router;
}
