// src/routes/views.router.js
import { Router } from "express";

export default function viewsRouter(productManager, cartManager) {
  const router = Router();

  router.get("/", async (req, res) => {
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
      });
    } catch (error) {
      res.status(500).send("Error al cargar productos");
    }
  });

  router.get("/realtimeproducts", async (req, res) => {
    const products = await productManager.getProducts();
    res.render("realTimeProducts", { products, title: "Productos en tiempo real" });
  });

  router.get("/carts/:cid", async (req, res) => {
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
      });
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  return router;
}
