// /js/cartDetail.js
document.addEventListener("DOMContentLoaded", () => {
  const user = window?.user || null;
  const cartId = user?.cart || null;

  if (!cartId) {
    alert("No hay carrito asociado al usuario");
    window.location.href = "/";
    return;
  }

  // Eliminar producto del carrito
  document.querySelectorAll(".carrito-producto-eliminar").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pid = btn.dataset.id;
      try {
        const r = await fetch(`/api/carts/${cartId}/products/${pid}`, {
          method: "DELETE",
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return alert(data.error || "Error al eliminar");
        // Toast diferido: se mostrará DESPUÉS del reload
        sessionStorage.setItem(
          "flashToast",
          JSON.stringify({
            text: "Producto eliminado",
            duration: 1500,
            gravity: "top",
            position: "right",
          })
        );

        window.location.reload(); // ← recarga total
      } catch (e) {
        alert("Error en la solicitud");
      }
    });
  });

  // Vaciar carrito
  const btnVaciar = document.getElementById("carrito-acciones-vaciar");
  if (btnVaciar) {
    btnVaciar.addEventListener("click", async () => {
      try {
        const r = await fetch(`/api/carts/${cartId}`, { method: "DELETE" });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return alert(data.error || "Error al vaciar");
        Toastify({
          text: "Carrito vaciado",
          duration: 1500,
          gravity: "top",
          position: "right",
        }).showToast();
        window.location.reload(); // ← recarga total
      } catch (e) {
        alert("Error en la solicitud");
      }
    });
  }

  // Comprar carrito
  const btnComprar = document.getElementById("carrito-acciones-comprar");
  if (btnComprar) {
    btnComprar.addEventListener("click", async () => {
      const total = document.getElementById("carrito-total")?.innerText || "$0";
      const result = await Swal.fire({
        title: "Finalizar compra?",
        text: `Tu compra asciende a ${total}. ¿Estás de acuerdo?`,
        showDenyButton: true,
        confirmButtonText: "Finalizar Compra",
        denyButtonText: "Seguir comprando",
        icon: "question",
      });
      if (!result.isConfirmed) return;

      try {
        // marcar como comprado
        await fetch(`/api/carts/${cartId}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "comprado" }),
        });

        // crear nuevo carrito
        const resNew = await fetch("/api/carts", { method: "POST" });
        if (!resNew.ok) throw new Error("No se pudo crear el nuevo carrito");
        const nuevoCart = await resNew.json();

        // asociarlo al usuario
        await fetch("/api/sessions/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newCartId: nuevoCart._id }),
        });

        // ir a home
        window.location.href = "/";
      } catch (e) {
        console.error(e);
        alert("Error al finalizar la compra");
      }
    });
  }
});
