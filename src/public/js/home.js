// /js/home.js
document.addEventListener("DOMContentLoaded", () => {
  const user = window?.user || null;
  const cartId = user?.cart || null;

  // Si no hay carrito, bloqueo "Agregar"
  const addBtns = document.querySelectorAll(".producto-agregar");
  if (!cartId) {
    addBtns.forEach((b) => {
      b.disabled = true;
      b.title = "No hay un carrito asociado al usuario";
    });
  } else {
    // Agregar producto => POST + recarga
    addBtns.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const pid = btn.dataset.id;
        try {
          const res = await fetch(`/api/carts/${cartId}/products/${pid}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qty: 1 }),
          });
          const data = await res.json();
          if (res.ok) {
            // Toast diferido: se mostrará DESPUÉS del reload
            sessionStorage.setItem(
              "flashToast",
              JSON.stringify({
                text: "Producto agregado al carrito",
                backgroundColor: "#28a745",
                duration: 1600,
              })
            );
            window.location.reload(); // navegación completa
          } else {
            alert(data.error || "Error al agregar");
          }
        } catch (err) {
          alert("Error en la solicitud");
        }
      });
    });
  }

  // Limit/Sort -> navegar con recarga
  const limit = document.getElementById("limit");
  const sort = document.getElementById("sort");
  if (limit) limit.addEventListener("change", navigateWithParams);
  if (sort) sort.addEventListener("change", navigateWithParams);

  function navigateWithParams() {
    const params = new URLSearchParams(window.location.search);
    if (limit) params.set("limit", limit.value);
    if (sort) params.set("sort", sort.value);
    window.location.href = `/?${params.toString()}`;
  }
});
