function showFlashToastIfAny() {
  const raw = sessionStorage.getItem("flashToast");
  if (!raw) return;
  sessionStorage.removeItem("flashToast");
  try {
    const cfg = JSON.parse(raw);
    Toastify({
      text: cfg.text || "OK",
      duration: cfg.duration ?? 2000,
      gravity: cfg.gravity || "top",
      position: cfg.position || "right",
      backgroundColor: cfg.backgroundColor || undefined,
      close: true,
      stopOnFocus: true,
    }).showToast();
  } catch (_) {}
}

document.addEventListener("DOMContentLoaded", () => {
  const user = window?.user || null;
  const cartId = user?.cart || null;
  // Detecto si estoy en la vista de carrito (ej: /carts o /carts/:cid)
  const isCartView = /^\/carts(\/|$)/.test(window.location.pathname);

  // Toggle de la UI lateral (categorías vs. "Seguir comprando")
  const categorias = document.querySelectorAll(".boton-categoria");
  const linkVolver = document.querySelector(".boton-volver");

  if (isCartView) {
    // En carrito: oculto categorías, muestro "Seguir comprando"
    categorias.forEach((btn) => btn.classList.add("disable"));
    if (linkVolver) linkVolver.classList.remove("disable");
  } else {
    // En resto (home, login, etc.): muestro categorías, oculto "Seguir comprando"
    categorias.forEach((btn) => btn.classList.remove("disable"));
    if (linkVolver) linkVolver.classList.add("disable");
  }

  // Logout clásico + redirect
  const logout = document.getElementById("logoutLink");
  if (logout) {
    logout.addEventListener(
      "click",
      async (e) => {
        e.preventDefault();
        try {
          await fetch("/api/sessions/logout");
        } catch (_) {}
        window.location.href = "/login";
      },
      { once: true }
    );
  }

  // Link del carrito
  const linkCarrito = document.getElementById("boton-carrito");
  if (linkCarrito) {
    linkCarrito.href = cartId ? `/carts/${cartId}` : "/carts";
  }

  // Totales en el sidebar del carrito (si hay cart)
  if (cartId) {
    updateSidebarTotals(cartId);
  } else {
    // reset sidebar
    document.getElementById("carrito-contenido")?.classList.add("disable");
    setText("#numerito", "0");
    setText("#carrito-contenido-cantidad", "0");
    setText("#carrito-contenido-precio", "$0");
  }

  // Botones de categorías -> navegar con recarga
  document.querySelectorAll(".boton-categoria").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.id;
      const params = new URLSearchParams(window.location.search);
      if (id === "todos") params.delete("query");
      else params.set("query", capitalize(id));
      window.location.href = `/?${params.toString()}`;
    });
  });
  showFlashToastIfAny();
});

async function updateSidebarTotals(cartId) {
  try {
    const r = await fetch(`/api/carts/${cartId}/totals`);
    if (!r.ok) return;
    const t = await r.json();

    if ((t.totalCantidad ?? 0) > 0) {
      document.getElementById("carrito-contenido")?.classList.remove("disable");
    }
    setText("#numerito", String(t.totalCantidad ?? 0));
    setText("#carrito-contenido-cantidad", String(t.totalCantidad ?? 0));
    setText("#carrito-contenido-precio", `$${(t.totalPrecio ?? 0).toFixed(2)}`);
  } catch (e) {
    console.error("Totales sidebar:", e);
  }
}

function setText(sel, txt) {
  const el = document.querySelector(sel);
  if (el) el.textContent = txt;
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
