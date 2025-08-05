let cartId = null;
let user = null;
async function estadoInicial() {
  if (cartId) await actualizarTotales(cartId);
  const linksCategorias = document.querySelectorAll(".boton-categoria");
  const linkVolver = document.querySelector(".boton-volver");

  // Oculto los botones de categoria
  linksCategorias.forEach((link) => {
    link.classList.add("disable");
  });

  // Muestro el boton de seguir comprando
  linkVolver.classList.remove("disable");

  // si no hay carrito oculto el contenedor del carrito
}
async function actualizarTotales() {
  const carritoContenedor = document.getElementById("carrito-contenido");
  const numeritoCarrito = document.getElementById("numerito");
  const carritoCantidad = document.getElementById("carrito-contenido-cantidad");
  const carritoTotalSidebar = document.getElementById("carrito-contenido-precio");
  const carritoTotalVista = document.getElementById("carrito-total");
  const linkCarrito = document.getElementById("boton-carrito");

  try {
    const res = await fetch(`/api/carts/${cartId}/totales`);
    if (res.ok) {
      const totales = await res.json();

      if (totales.totalCantidad > 0) {
        carritoContenedor?.classList.remove("disable");
      }

      if (numeritoCarrito) numeritoCarrito.textContent = totales.totalCantidad;
      if (carritoCantidad) carritoCantidad.textContent = totales.totalCantidad;
      if (carritoTotalSidebar) carritoTotalSidebar.textContent = `$${totales.totalPrecio.toFixed(2)}`;
      if (carritoTotalVista) carritoTotalVista.textContent = `$${totales.totalPrecio.toFixed(2)}`;
      if (linkCarrito) linkCarrito.href = `/carts/${cartId}`;
    }
  } catch (err) {
    console.error("Error al actualizar totales:", err);
  }
}

async function eliminarProducto(boton) {
  const id = boton.dataset.id;
  if (!cartId) {
    alert("No hay carrito para eliminar productos");
    return;
  }

  try {
    const res = await fetch(`/api/carts/${cartId}/product/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      Toastify({
        text: "Producto eliminado del carrito",
        duration: 2000,
        gravity: "top",
        position: "right",
        backgroundColor: "#dc3545",
      }).showToast();

      // 🔸 Remover del DOM el producto eliminado
      const productoElemento = boton.closest(".carrito-producto");
      if (productoElemento) {
        productoElemento.remove();
      }

      // 🔸 Actualizar totales
      await actualizarTotales(cartId);

      // 🔸 Si no quedan productos, mostrar mensaje de vacío y ocultar acciones
      const productosRestantes = document.querySelectorAll(".carrito-producto");
      if (productosRestantes.length === 0) {
        document.getElementById("carrito-productos")?.remove();
        document.getElementById("carrito-acciones")?.classList.add("disable");
        document.getElementById("carrito-comprado")?.classList.add("disable");
        document.getElementById("carrito-vacio")?.classList.remove("disable");
      }
    } else {
      const data = await res.json();
      alert(data.error || "Error al eliminar");
    }
  } catch (err) {
    console.error("Error al eliminar el producto:", err);
    alert("Error en la solicitud");
  }
}

function configBotonesEliminar() {
  const botonesEliminar = document.querySelectorAll(".carrito-producto-eliminar");
  botonesEliminar.forEach((boton) => {
    boton.addEventListener("click", () => {
      eliminarProducto(boton);
    });
  });
}

async function vaciarCarrito() {
  if (!cartId) {
    alert("No hay carrito para eliminar productos");
    return;
  }
  try {
    const res = await fetch(`/api/carts/${cartId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      Toastify({
        text: "Carrito vaciado",
        duration: 2000,
        gravity: "top",
        position: "right",
        backgroundColor: "#dc3545",
      }).showToast();
      // Actualizamos el número de productos en el carrito
      actualizarTotales(cartId);
      location.reload();
      // actualizo el estado del carrito
      try {
        const res = await fetch(`/api/carts/${cartId}/estado`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: "inactivo" }),
        });
      } catch (error) {
        console.error("Error al actualizar el estado del carrito:", error);
      }
    } else {
      const data = await res.json();
      alert(data.error || "Error al vaciar el carrito");
    }
  } catch (err) {
    console.error("Error al vaciar:", err);
    alert("Error en la solicitud");
  }
}

function cargarModuloDinamico(src) {
  const script = document.createElement("script");
  script.type = "module";
  script.src = `${src}?reload=${Date.now()}`;
  document.body.appendChild(script);
}
function interceptarVolverAProductos() {
  const botonVolver = document.querySelector(".boton-volver");
  if (!botonVolver) return;

  botonVolver.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      const html = await fetch("/").then((res) => res.text());

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const nuevoMain = doc.querySelector("main");

      // Animación
      //nuevoMain.classList.add("fade-in");

      const viejoMain = document.querySelector("main");
      viejoMain.replaceWith(nuevoMain);

      // Cambiar la URL sin recarga
      history.pushState(null, "", "/");
      document.title = "My eCommerce";
      // Cargar dinámicamente el script de home.js
      cargarModuloDinamico("/js/home.js");
    } catch (err) {
      console.error("Error al volver a productos:", err);
      alert("Error al volver a la vista de productos");
    }
  });
}
async function comprarCarrito() {
  const total = document.getElementById("carrito-total");

  if (!cartId) {
    alert("No hay carrito activo");
    return;
  }

  Swal.fire({
    title: "Finalizar compra?",
    text: `Tu compra asciende a ${total.innerText}. ¿Estás de acuerdo?`,
    showDenyButton: true,
    confirmButtonText: "Finalizar Compra",
    denyButtonText: `Seguir comprando`,
    icon: "question",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // Marcar el carrito como comprado en el backend
        await fetch(`/api/carts/${cartId}/estado`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: "comprado" }),
        });
        // Creo un nuevo carrito
        const nuevoCartRes = await fetch("/api/carts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (nuevoCartRes.ok) {
          const nuevoCart = await nuevoCartRes.json();
          cartId = nuevoCart._id;

          // Actualizar el carrito en el backend
          await fetch("/api/users/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newCartId: cartId }),
          });

          // Actualizar el carrito en el frontend
          if (window.user) {
            window.user.cart = cartId;
          }
        }
        // Cargar la vista de productos dinámicamente
        const html = await fetch("/").then((res) => res.text());
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const nuevoMain = doc.querySelector("main");

        // Animación de entrada (opcional)
        nuevoMain.classList.add("fade-in");

        const viejoMain = document.querySelector("main");
        viejoMain.replaceWith(nuevoMain);

        // Actualizar URL
        history.pushState(null, "", "/");

        // Cargar el script del home dinámicamente
        cargarModuloDinamico("/js/home.js");

        // Mostrar mensaje final
        Swal.fire({
          title: "Compra Finalizada",
          text: "Gracias por tu compra",
          icon: "success",
        });
      } catch (error) {
        console.error("Error al finalizar la compra:", error);
        alert("Ocurrió un error al finalizar la compra");
      }
    }
  });
}

async function main() {
  cartId = window.user.cart;
  user = window.user;
  estadoInicial();
  if (cartId) actualizarTotales();
  configBotonesEliminar();
  interceptarVolverAProductos();
  const botonVaciar = document.getElementById("carrito-acciones-vaciar");
  if (botonVaciar) botonVaciar.addEventListener("click", vaciarCarrito);
  const botonComprar = document.getElementById("carrito-acciones-comprar");
  if (botonComprar) {
    botonComprar.addEventListener("click", comprarCarrito);
  }
}
main();
