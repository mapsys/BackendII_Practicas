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

      const confirm = await Swal.fire({
        title: "Finalizar compra?",
        text: `Tu compra asciende a ${total}. ¿Estás de acuerdo?`,
        showDenyButton: true,
        confirmButtonText: "Finalizar Compra",
        denyButtonText: "Seguir comprando",
        icon: "question",
      });
      if (!confirm.isConfirmed) return;

      btnComprar.disabled = true; // evita doble click
      try {
        // 1) Intentar marcar como comprado
        const r = await fetch(`/api/carts/${cartId}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "comprado" }),
        });

        // 2) Leer body (incluso en error)
        let data = {};
        try {
          data = await r.json();
        } catch (_) {}

        // 3) Si falló, mostrar el motivo y NO seguir
        if (!r.ok) {
          await Swal.fire({
            title: "No se pudo finalizar la compra",
            text: data.error || data.message || "Ocurrió un error al validar stock.",
            icon: "error",
          });
          return;
        }

        // 4) Éxito → crear nuevo carrito y asociarlo al user
        const resNew = await fetch("/api/carts", { method: "POST" });
        if (!resNew.ok) {
          let d = {};
          try {
            d = await resNew.json();
          } catch (_) {}
          throw new Error(d.error || "No se pudo crear el nuevo carrito");
        }
        const nuevoCart = await resNew.json();

        const resSet = await fetch("/api/sessions/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newCartId: nuevoCart._id }),
        });
        if (!resSet.ok) {
          let d = {};
          try {
            d = await resSet.json();
          } catch (_) {}
          throw new Error(d.error || "No se pudo asociar el carrito al usuario");
        }

        // 5) Feedback + redirect
        sessionStorage.setItem("flashToast", JSON.stringify({ text: "Compra realizada con éxito", backgroundColor: "#28a745" }));
        window.location.href = "/";
      } catch (e) {
        console.error(e);
        Swal.fire({ title: "Error", text: e.message || "Error al finalizar la compra", icon: "error" });
      } finally {
        btnComprar.disabled = false;
      }
    });
  }
});
