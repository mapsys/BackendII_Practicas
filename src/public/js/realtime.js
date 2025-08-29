const socket = io();

// —— helpers ——
function getThumbnail(thumbnails) {
  if (!Array.isArray(thumbnails) || !thumbnails[0] || String(thumbnails[0]).trim() === "") {
    return "/img/no-image.png";
  }
  return String(thumbnails[0]).trim();
}

const fmtARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

// —— listeners socket ——
socket.on("products:error", (msg) => {
  alert(`Error: ${msg}`);
});

socket.on("products", (products) => {
  const list = document.getElementById("product-list");
  if (!list) return;

  list.innerHTML = "";
  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "realtime-producto";

    // Armado con template (rápido). Si querés máxima seguridad XSS, creá nodos y setea textContent.
    card.innerHTML = `
      <img class="realtime-imagen" src="${getThumbnail(product.thumbnails)}" alt="${product.title}" />
      <div class="realtime-producto-titulo">
        <small>Nombre</small>
        <h4>${product.title}</h4>
      </div>
      <div class="realtime-producto-precio">
        <small>Precio</small>
        <p>${fmtARS.format(product.price)}</p>
      </div>
      <button data-id="${product._id}" class="delete-btn">
        <i class="bi bi-trash-fill" style="color: red;"></i>
      </button>
    `;
    // Usá append si querés conservar el orden original / prepend si querés “más nuevo arriba”
    list.prepend(card);
  });

  const counter = document.getElementById("product-count");
  if (counter) counter.textContent = `Total de productos: ${products.length}`;
});

// —— agregar producto ——
const form = document.getElementById("add-product-form");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("title")?.value.trim();
    const description = document.getElementById("description")?.value.trim();
    const price = Number(document.getElementById("price")?.value);
    const thumbnail = document.getElementById("thumbnail")?.value.trim();
    const code = document.getElementById("code")?.value.trim();
    const stock = Number(document.getElementById("stock")?.value);
    const category = document.getElementById("category")?.value.trim();

    if (!title || !description || !code || !category || !(price > 0) || !(stock >= 0)) {
      alert("Completa todos los campos. Precio debe ser > 0 y stock >= 0.");
      return;
    }

    socket.emit("addProduct", { title, description, price, thumbnail, code, stock, category });
    form.reset();
  });
}

// —— eliminar producto (delegación sobre el documento o, mejor, sobre #product-list) ——
const list = document.getElementById("product-list");
(list || document).addEventListener("click", (e) => {
  const btn = e.target.closest(".delete-btn");
  if (!btn) return;
  const id = btn.dataset.id;
  if (!id) return;

  if (confirm("¿Seguro que deseas eliminar este producto?")) {
    socket.emit("deleteProduct", id);
  }
});

// —— lateral: oculto categorías, muestro “Seguir comprando” y oculto carrito ——
const linksCategorias = document.querySelectorAll(".boton-categoria");
linksCategorias.forEach((link) => link.classList.add("disable"));

const linkVolver = document.querySelector(".boton-volver");
if (linkVolver) linkVolver.classList.remove("disable");

const botonCarrito = document.getElementById("boton-carrito");
if (botonCarrito) botonCarrito.classList.add("disable");
