# 🛍️ eCommerce Backend con Autenticación y Autorización (JWT + Passport)

Este proyecto corresponde a la **Entrega N°1 del curso Backend II**, donde se implementa un sistema completo de gestión de usuarios con autenticación basada en JSON Web Tokens (JWT) y autorización mediante estrategias de Passport.js.

## 🔧 Tecnologías utilizadas

- Node.js
- Express
- MongoDB + Mongoose
- Passport.js
- bcryptjs
- JWT (jsonwebtoken)
- Express Handlebars
- WebSockets (Socket.io)

## 📁 Estructura del proyecto

```
src/
├── config/              # Configuración de Passport, MongoDB y utilidades
├── controllers/         # Lógica de negocio para usuarios, productos y carritos 
├── managers/            # Lógica de negocio para usuarios, productos y carritos
├── middlewares/         # Middlewares personalizados
├── models/              # Esquemas de Mongoose
├── public/              # Archivos estáticos (JS, CSS, imágenes)
├── routes/              # Rutas de la API y vistas
├── sockets/             # Websockets para actualizaciones en tiempo real
├── views/               # Vistas Handlebars
└── server.js            # Punto de entrada principal

```

## 👤 Modelo de Usuario

El modelo de usuario (`user.model.js`) incluye:

- `first_name`, `last_name`, `email`, `age`, `password` (hasheada)
- `cart`: referencia a `Cart`
- `role`: `"user"` o `"admin"` dependiendo del email (`@coder.com`)

La contraseña se encripta automáticamente antes de guardar con `bcryptjs`.

## 🔐 Autenticación y Autorización

Se utilizan estrategias Passport:

- `login`: Verifica email/contraseña y genera un JWT
- `current`: Extrae el usuario desde el JWT almacenado en la cookie `cookieToken`

El token JWT se guarda en una cookie HTTP Only segura.

## 📌 Rutas principales

- `POST /api/users/register` → Registro de usuarios
- `POST /api/users/login` → Login de usuario (genera JWT)
- `GET /api/sessions/current` → Devuelve datos del usuario autenticado
- `GET /api/users/logout` → Borra la cookie y desloguea al usuario

## 🧪 Scripts

```bash
npm install     # Instala dependencias
npm run dev     # Ejecuta el servidor con nodemon
```

## 📬 Postman

Se incluye la colección Postman para testear las rutas en:  
`Curso_Backend_pisano.postman_collection.json`

## ✅ Estado del proyecto

- [x] Modelo de usuario implementado con todos los campos requeridos
- [x] Contraseña encriptada correctamente
- [x] Estrategias Passport funcionando (login y current)
- [x] Token JWT emitido y almacenado en cookie
- [x] Ruta `/api/sessions/current` funcionando
- [x] Uso correcto de middlewares para proteger rutas privadas

---

## 📎 Autor

Mariano Pisano  
Entrega correspondiente al curso Backend II