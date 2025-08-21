// src/middlewares/errorHandler.js
export function errorHandler(err, req, res, _next) {
  // Duplicado por índice único de Mongo
  if (err?.code === 11000) {
    const campo = Object.keys(err.keyPattern || err.keyValue || { code: 1 })[0];
    return res.status(400).json({
      status: "error",
      error: `El campo ${campo} debe ser único`,
    });
  }

  if (err?.name === "ValidationError") {
    const detalles = Object.values(err.errors).map(e => e.message || `Campo ${e?.path} inválido`);
    return res.status(400).json({ status: "error", error: detalles.join("; ") });
  }

  const status = err.status || 500;
  res.status(status).json({ status: "error", error: err.message || "Error interno del servidor" });
}
