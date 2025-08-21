import express from "express";
import exphbs from "express-handlebars";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createServer } from "http";
import ProductManager from "./managers/productManagerMongo.js";
import CartManager from "./managers/cartManagerMongo.js";
import productsRouter from "./routes/products.router.js";
import sessionsRouter from "./routes/sessions.router.js";
import cartsRouter from "./routes/carts.router.js";
import viewsRouter from "./routes/views.router.js";
import { Server } from "socket.io";
import { connectDB } from "./config/mongo.js";
import { configureSockets } from "./sockets/index.js";
import cors from "cors";
import dotenv from "dotenv";
import passport from 'passport';
import { iniciarPassport } from './config/passport.config.js';
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errorHandler.js";


// Uso de Env para la conexion
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = join(__dirname, "src/data");




// Configuro express y Socket.IO
const app = express();
app.use(cookieParser());
const httpServer = createServer(app);
const io = new Server(httpServer);
// app.use(
//   cors({
//     origin: "http://localhost:5173", 
//   })
// );

const PORT = process.env.PORT || 8080;
const productManager = new ProductManager();
const cartManager = new CartManager();
// Configuro Passport 
iniciarPassport()
app.use(passport.initialize())

// Configuro Handlebars
const hbs = exphbs.create({
  helpers: {
    firstThumbnail: (thumbnails) => {
      const primer = thumbnails && thumbnails[0] && thumbnails[0].trim();
      return primer ? primer : "/img/no-image.png";
    },
    json: (context) => JSON.stringify(context), // 👈 agregá este helper
  },
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", join(__dirname, "./views"));

// Configuro Static
app.use(express.static(join(__dirname, "./public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// conecto a MongoDB
connectDB();

// Rutas
app.use("/api/products", productsRouter());
app.use("/api/carts", cartsRouter());
app.use("/", viewsRouter(productManager, cartManager));
app.use("/api/sessions", sessionsRouter());
app.use(errorHandler);
// WebSocket connection
configureSockets(io, productManager);

httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
