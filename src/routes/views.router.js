// src/routes/views.router.js
import { Router } from "express";
import passport from "passport";
import ViewsController from "../controllers/views.controller.js";
// Si tenés un authAdmin que revisa req.user.role === 'admin', reusalo:
import { authAdminView } from "../middlewares/auth.js";

export default function viewsRouter() {
  const router = Router();
  const controller = new ViewsController();

  // Para VISTAS queremos redirigir al login si no hay token:
  const viewAuth = passport.authenticate("current", { session: false, failureRedirect: "/login" });

  // Home con paginación (usa ProductService.paginate)
  router.get("/", viewAuth, controller.home);

  // Vista realtime (admin)
  router.get("/realtimeproducts", viewAuth, authAdminView, controller.realTimeProducts);

  // Detalle de carrito (usa CartService.getById(..., { populate: true }))
  router.get("/carts/:cid", viewAuth, controller.cartDetail);
  // Vista de perfil
  router.get("/profile", viewAuth, controller.profile);
  // Vistas públicas
  router.get("/register", controller.registerView);
  router.get("/login", controller.loginView);

  // Vista logout (si usás sesiones de express para esta vista)
  router.get("/logout", controller.logoutView);

  return router;
}
