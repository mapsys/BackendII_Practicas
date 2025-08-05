document.getElementById("logoutLink")?.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    await fetch("/api/users/logout", {
      method: "GET",
      credentials: "include", // 👈 para que la cookie viaje
    });

    // Limpiar datos del frontend
    window.user = null;

    // Redirigir
    window.location.href = "/login";
  } catch (error) {
    console.error("Error al hacer logout:", error);
  }
});
