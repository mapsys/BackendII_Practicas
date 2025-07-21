// src/routes/products.router.js
import { Router } from "express";

export default function productsRouter(productManager) {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const { limit = 10, page = 1, sort, query } = req.query;
      // Armo el filtro
      const filtro = {};
      if (query) {
        if (query === "disponibles") {
          filtro.stock = { $gt: 0 };
        } else {
          filtro.category = query;
        }
      }
      // Armo opciones para paginate
      const options = {
        limit: parseInt(limit),
        page: parseInt(page),
        sort: sort === "asc" ? { price: 1 } : sort === "desc" ? { price: -1 } : undefined,
        lean: true,
      };

      const result = await productManager.paginate(filtro, options);
      const response = {
        status: "success",
        payload: result.docs,
        totalPages: result.totalPages,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink: result.hasPrevPage ? `/api/products?page=${result.prevPage}` : null,
        nextLink: result.hasNextPage ? `/api/products?page=${result.nextPage}` : null,
      };
      res.json(response);
    } catch (error) {
      res.status(500).json({ status: "error", error: error.message });
    }
  });

  router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const product = await productManager.getProductById(id);
      res.status(200).json(product);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  router.post("/", async (req, res) => {
    const { description, price, thumbnail, title, code, stock } = req.body;
    if (!title || !description || !price || !code || !stock) {
      return res.status(400).json({ error: "Los campos Title, Description, Price, Code y Stock son obligatorios" });
    }
    try {
      const newProduct = await productManager.addProduct(description, price, thumbnail, title, code, stock);
      res.status(201).json(newProduct);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const updatedFields = req.body;
    try {
      const updatedProduct = await productManager.updateProduct(id, updatedFields);
      res.status(200).json(updatedProduct);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await productManager.deleteProduct(id);
      res.status(200).json({ message: "Producto eliminado correctamente" });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  return router;
}
