# 🛒 Entrega 2 - Curso Backend

Proyecto de backend con Express y Handlebars que implementa:

- Sistema de productos con CRUD
- Carrito de compras con persistencia en MongoDB
- Paginación, filtros y ordenamiento
- Vistas con Handlebars
- Actualización dinámica con JavaScript y Toastify
- Socket.io para productos en tiempo real

## 📂 Estructura

```
/src
  /routes        ← Rutas API y vistas
  /views         ← Plantillas Handlebars
  /managers      ← Lógica de productos y carritos
  /models        ← Esquemas de Mongoose
  /public        ← JS y CSS frontend
```

## 🔌 Endpoints principales

### Productos

- `GET /api/products` con paginación, filtros y orden
- `GET /api/products/:code`
- `POST /api/products` → crear
- `PUT /api/products/:code` → actualizar
- `DELETE /api/products/:id` → eliminar

### Carritos

- `POST /api/carts` → crea un carrito
- `POST /api/carts/:cid/products/:pid` → agrega producto
- `DELETE /api/carts/:cid/products/:pid` → elimina producto
- `DELETE /api/carts/:cid` → vacía carrito
- `GET /api/carts/:cid/totales` → totales actualizados

### Vistas

- `/` → home
- `/realtimeproducts` → productos en tiempo real
- `/carts/:cid` → vista de carrito

## 📦 Dependencias

- express
- express-handlebars
- mongoose
- socket.io
- nodemon (dev)

## ✍️ Autor

Mariano Pisano

## NOTAS

- hay muchas cosas que quisiera hacer mejor. El trabajo cumple con lo pedido pero se que hay mucho que quiza no es profesional. Por ejemplo tenes todo el JS junto en vez de separarlo por paginas de Index y de Carrito.
- Tener todo el script dentro del eventlistener DOMContentLoaded. Pero sin usar un framework no encontre manera de que todo se recargue solo
