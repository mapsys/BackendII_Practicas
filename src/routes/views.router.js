// src/routes/views.router.js
import { Router } from "express";
import { auth, authAdmin } from "../middlewares/auth.js";
import passport from "passport";
export default function viewsRouter(productManager, cartManager) {
  const router = Router();

  router.get("/", passport.authenticate("current", { session: false, failureRedirect: "/login" }), async (req, res) => {
    try {
      const { limit = 10, page = 1, sort, query } = req.query;

      const filtro = {};
      if (query) {
        if (query === "disponibles") {
          filtro.stock = { $gt: 0 };
        } else {
          filtro.category = query;
        }
      }

      const options = {
        limit: parseInt(limit),
        page: parseInt(page),
        sort: sort === "asc" ? { price: 1 } : sort === "desc" ? { price: -1 } : undefined,
        lean: true,
      };

      const result = await productManager.paginate(filtro, options);

      res.render("home", {
        products: result.docs,
        totalPages: result.totalPages,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        query,
        sort,
        limit,
        title: "My eCommerce",
        user: req.user,
      });
    } catch (error) {
      res.status(500).send("Error al cargar productos");
    }
  });

  router.get("/realtimeproducts", passport.authenticate("current", { session: false, failureRedirect: "/login" }), authAdmin, async (req, res) => {
    const products = await productManager.getProducts();
    res.render("realTimeProducts", { products, title: "Productos en tiempo real" });
  });

  router.get("/carts/:cid", passport.authenticate("current", { session: false, failureRedirect: "/login" }), async (req, res) => {
    const { cid } = req.params;
    try {
      const cart = await cartManager.getCartById(cid);
      await cart.populate("products.product");

      const productosConSubtotal = cart.products.map((item) => ({
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.quantity * item.product.price,
        thumbnail: item.product.thumbnails[0],
        id: item.product._id,
      }));

      const total = productosConSubtotal.reduce((acc, p) => acc + p.subtotal, 0);

      res.render("cartDetail", {
        title: "Tu Carrito",
        productos: productosConSubtotal,
        total,
        user: req.user,
      });
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  router.get("/register", (req, res) => {
    res.render("register"); // Handlebars busca register.handlebars
  });

  router.get("/login", (req, res) => {
    res.render("login");
  });

  // router.get("/logout", (req, res) => {
  //   req.session.destroy((err) => {
  //     if (err) return res.status(500).send("Error al cerrar sesión");

  //     res.clearCookie("connect.sid"); // borra la cookie en el navegador
  //     res.render("logout"); // o res.redirect("/login");
  //   });
  // });
  return router;
}
