// src/controllers/views.controller.js
import ProductService from "../services/product.service.js";
import CartService from "../services/cart.service.js";
import mongoose from "mongoose";

export default class ViewsController {
  constructor({ productService = new ProductService(), cartService = new CartService() } = {}) {
    this.products = productService;
    this.carts = cartService;
  }

  home = async (req, res, next) => {
    try {
      // Reusa la paginación del service
      const result = await this.products.paginate(req.query); // docs, totalPages, etc.

      res.render("home", {
        products: result.docs,
        totalPages: result.totalPages,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        query: req.query.query,
        sort: req.query.sort,
        limit: req.query.limit,
        title: "My eCommerce",
        user: req.user,
      });
    } catch (err) {
      next(err);
    }
  };

  realTimeProducts = async (req, res, next) => {
    try {
      // Si querés estrictamente "todos", podés pedir un límite grande:
      const result = await this.products.paginate({ limit: 1000, page: 1 });
      res.render("realTimeProducts", { products: result.docs, title: "Productos en tiempo real" });
    } catch (err) {
      next(err);
    }
  };

  cartDetail = async (req, res, next) => {
    try {
      const { cid } = req.params;
      if (!mongoose.Types.ObjectId.isValid(cid)) {
        return res.status(400).send("El ID de carrito no es válido");
      }

      // Trae el carrito con populate desde el service
      const cart = await this.carts.getById(cid, { populate: true });

      const productosConSubtotal = (cart.products || []).map((item) => {
        const thumbs = Array.isArray(item.product?.thumbnails) ? item.product.thumbnails : [];
        return {
          title: item.product?.title,
          price: item.product?.price,
          quantity: item.quantity,
          subtotal: item.quantity * (item.product?.price ?? 0),
          thumbnails: thumbs, // ← pasamos el array para usar el helper
          id: item.product?._id,
        };
      });

      const total = productosConSubtotal.reduce((acc, p) => acc + p.subtotal, 0);

      res.render("cartDetail", {
        title: "Tu Carrito",
        productos: productosConSubtotal,
        total,
        user: req.user,
      });
    } catch (err) {
      next(err);
    }
  };

  registerView = (_req, res) => res.render("register");
  loginView = (_req, res) => res.render("login");

  // Si seguís usando sesiones de express para esta vista, la dejamos igual
  logoutView = (req, res) => {
    req.session?.destroy?.((err) => {
      if (err) return res.status(500).send("Error al cerrar sesión");
      res.clearCookie("connect.sid");
      res.render("logout");
    });
  };
}
