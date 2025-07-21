export const configureSockets = (io, productManager) => {
  io.on("connection", async (socket) => {
    console.log("🟢 Cliente conectado");

    const products = await productManager.getProducts();
    socket.emit("products", products);

    socket.on("addProduct", (productData) => {
      (async () => {
        try {
          await productManager.addProduct(
            productData.description,
            productData.price,
            productData.thumbnail,
            productData.title,
            productData.code,
            productData.stock,
            productData.category
          );
          const updatedProducts = await productManager.getProducts();
          io.emit("products", updatedProducts);
        } catch (error) {
          socket.emit("error", error.message);
        }
      })();
    });

    socket.on("deleteProduct", async (id) => {
      try {
        await productManager.deleteProduct(id);
        const updated = await productManager.getProducts();
        io.emit("products", updated);
      } catch (err) {
        socket.emit("error", err.message);
      }
    });
  });
};
