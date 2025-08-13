// src/middlewares/errorHandler.js
export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const message = err.message || "Error interno del servidor";
  res.status(status).json({ status: "error", error: message });
}
