import express from "express";
import exphbs from "express-handlebars";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createServer } from "http";
import ProductManager from "./src/managers/productManagerMongo.js";
import CartManager from "./src/managers/cartManagerMongo.js";
import productsRouter from "./src/routes/products.router.js";
import cartsRouter from "./src/routes/carts.router.js";
import viewsRouter from "./src/routes/views.router.js";
import { Server } from "socket.io";
import { connectDB } from "./src/dbo/config.js";
import { configureSockets } from "./src/sockets/index.js";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = join(__dirname, "src/data");

// Configuro express y Socket.IO
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
const PORT = process.env.PORT || 8080;
// const productManager = await ProductManager.crear(dataPath);
const productManager = new ProductManager();
const cartManager = new CartManager();

// Configuro Handlebars
const hbs = exphbs.create({
  helpers: {
    firstThumbnail: (thumbnails) => {
      const primer = thumbnails && thumbnails[0] && thumbnails[0].trim();
      return primer ? primer : "/img/no-image.png";
    },
  },
});
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", join(__dirname, "src/views"));

// Configuro Static
app.use(express.static(join(__dirname, "src/public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// conecto a MongoDB
connectDB();

// Rutas
app.use("/api/products", productsRouter(productManager));
app.use("/api/carts", cartsRouter(cartManager, productManager));
app.use("/", viewsRouter(productManager, cartManager));

// WebSocket connection
configureSockets(io, productManager);

httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
