// src/routes/products.router.js
import { Router } from "express";
import passport from "passport";
import ProductsController from "../controllers/products.controller.js";

export default function productsRouter() {
  const router = Router();
  const controller = new ProductsController();

  const auth = passport.authenticate("current", { session: false, failureRedirect: "/login" });

  router.get("/", auth, controller.list);
  router.get("/:id", auth, controller.getOne);
  router.post("/", auth, controller.create);
  router.put("/:id", auth, controller.update);
  router.delete("/:id", auth, controller.remove);

  return router;
}
