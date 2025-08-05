let cartId = null;
let user = null;
function configurarCategorias() {
  const linksCategorias = document.querySelectorAll(".boton-categoria");
  const linkVolver = document.querySelector(".boton-volver");

  linksCategorias.forEach((link) => link.classList.remove("disable"));
  if (linkVolver) linkVolver.classList.add("disable");
}

async function actualizarTotales() {
  const carritoContenedor = document.getElementById("carrito-contenido");
  const numeritoCarrito = document.getElementById("numerito");
  const carritoCantidad = document.getElementById("carrito-contenido-cantidad");
  const carritoTotal = document.getElementById("carrito-contenido-precio");
  const linkCarrito = document.getElementById("boton-carrito");
  if (cartId) {
    try {
      const res = await fetch(`/api/carts/${cartId}/totales`);
      if (res.ok) {
        const totales = await res.json();
        if (totales.totalCantidad > 0) carritoContenedor.classList.remove("disable");
        if (numeritoCarrito) numeritoCarrito.textContent = totales.totalCantidad;
        if (carritoCantidad) carritoCantidad.textContent = totales.totalCantidad;
        if (carritoTotal) carritoTotal.textContent = `$${totales.totalPrecio.toFixed(2)}`;
        linkCarrito.href = `/carts/${cartId}`;
      }
    } catch (err) {
      console.error("Error al actualizar totales:", err);
    }
  } else {
    carritoContenedor.classList.add("disable");
    if (numeritoCarrito) numeritoCarrito.textContent = "0";
    if (carritoCantidad) carritoCantidad.textContent = "0";
    if (carritoTotal) carritoTotal.textContent = "$0";
    linkCarrito.href = "/carts";
  }
}

async function configBotonAgregar(event) {
  const productId = event.currentTarget.dataset.id;

  if (!cartId) {
    try {
      const cartRes = await fetch("/api/carts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const cartData = await cartRes.json();
      cartId = cartData._id;
      localStorage.setItem("cartId", cartId);
    } catch (err) {
      alert("Error al crear el carrito", err);
      return;
    }
  }

  try {
    const res = await fetch(`/api/carts/${cartId}/product/${productId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty: 1 }),
    });

    const data = await res.json();

    if (res.ok) {
      Toastify({
        text: "Producto agregado al carrito",
        duration: 2000,
        gravity: "top",
        position: "right",
        backgroundColor: "#28a745",
      }).showToast();

      await actualizarTotales(cartId);
    } else {
      alert(data.error || "Error al agregar");
    }
  } catch (err) {
    alert("Error en la solicitud");
  }
}

function conectarBotonesAgregar() {
  const botonesAgregar = document.querySelectorAll(".producto-agregar");
  botonesAgregar.forEach((boton) => boton.addEventListener("click", configBotonAgregar));
}

function interceptarNavegacion() {
  const contenedor = document.getElementById("productos-y-paginacion");
  contenedor.addEventListener("click", async (e) => {
    if (e.target.tagName === "A") {
      e.preventDefault();
      const url = e.target.href;
      const html = await fetch(url).then((res) => res.text());
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const nuevoContenido = doc.getElementById("productos-y-paginacion");

      contenedor.innerHTML = nuevoContenido.innerHTML;
      conectarBotonesAgregar();
    }
  });
}

async function updateQuery() {
  const limitSelect = document.getElementById("limit");
  const sortSelect = document.getElementById("sort");

  const params = new URLSearchParams(window.location.search);
  if (limitSelect) params.set("limit", limitSelect.value);
  if (sortSelect) params.set("sort", sortSelect.value);

  const url = `/?${params.toString()}`;
  const html = await fetch(url).then((res) => res.text());
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const nuevoContenido = doc.getElementById("productos-y-paginacion");

  document.getElementById("productos-y-paginacion").innerHTML = nuevoContenido.innerHTML;
  conectarBotonesAgregar();
}
function interceptarCategorias() {
  const botonesCategorias = document.querySelectorAll(".boton-categoria");

  botonesCategorias.forEach((boton) => {
    boton.addEventListener("click", async (e) => {
      e.preventDefault();

      // Obtener ID del botón (que coincide con la categoría)
      const categoria = boton.id;

      // Armar los parámetros actuales
      const params = new URLSearchParams(window.location.search);
      if (categoria === "todos") {
        params.delete("query");
      } else {
        params.set("query", capitalize(categoria));
      }
      // Mantener sort y limit si ya están
      const url = `/?${params.toString()}`;
      const html = await fetch(url).then((res) => res.text());
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const nuevoContenido = doc.getElementById("productos-y-paginacion");

      document.getElementById("productos-y-paginacion").innerHTML = nuevoContenido.innerHTML;

      // Actualizar clases visuales
      botonesCategorias.forEach((b) => b.classList.remove("active"));
      boton.classList.add("active");

      // Reconectar eventos
      conectarBotonesAgregar();
      interceptarNavegacion();
    });
  });
}
function cargarModuloDinamico(src) {
  const script = document.createElement("script");
  script.type = "module";
  script.src = `${src}?reload=${Date.now()}`;
  document.body.appendChild(script);
}
function capitalize(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}
function interceptarClickCarrito() {
  const botonCarrito = document.getElementById("boton-carrito");
  if (!botonCarrito) return;

  botonCarrito.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!cartId) {
      return;
    }

    try {
      const html = await fetch(`/carts/${cartId}`).then((res) => res.text());

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const nuevoMain = doc.querySelector("main");

      // Agregamos la animación antes de reemplazar
      //nuevoMain.classList.add("fade-in");

      const viejoMain = document.querySelector("main");
      viejoMain.replaceWith(nuevoMain);

      // Cambiar la URL sin recargar
      history.pushState(null, "", `/carts/${cartId}`);
      document.title = "Carrito";
      // Cargar dinámicamente el script
      cargarModuloDinamico("/js/cartDetail.js");
    } catch (err) {
      console.error("Error al cargar el carrito:", err);
      alert("Error al cargar la vista del carrito");
    }
  });
}
async function main() {
  configurarCategorias();
  cartId = window.user.cart;
  user = window.user;
  await actualizarTotales();
  conectarBotonesAgregar();
  interceptarNavegacion();
  interceptarCategorias();
  interceptarClickCarrito();
  const limitSelect = document.getElementById("limit");
  const sortSelect = document.getElementById("sort");
  const params = new URLSearchParams(window.location.search);

  if (limitSelect && params.get("limit")) limitSelect.value = params.get("limit");
  if (sortSelect && params.get("sort")) sortSelect.value = params.get("sort");

  if (limitSelect) limitSelect.addEventListener("change", updateQuery);
  if (sortSelect) sortSelect.addEventListener("change", updateQuery);
}

main();
