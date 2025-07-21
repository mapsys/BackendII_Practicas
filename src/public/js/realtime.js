const socket = io();
function getThumbnail(thumbnails) {
  if (!Array.isArray(thumbnails) || !thumbnails[0] || thumbnails[0].trim() === "") {
    return "/img/no-image.png";
  }
  return thumbnails[0];
}
// Actualizar lista de productos
socket.on("error", (errorMessage) => {
  alert(`Error: ${errorMessage}`);
});
socket.on("products", (products) => {
  const list = document.getElementById("product-list");
  list.innerHTML = "";
  products.forEach((product) => {
    const li = document.createElement("div");
    li.classList.add("realtime-producto");
    li.innerHTML = `
              <img class="realtime-imagen" src="${getThumbnail(product.thumbnails)}" alt="${product.title}" />
              <div class="realtime-producto-titulo">
                <small>Nombre</small>
                <h4>${product.title}</h4>
              </div>
              <div class="realtime-producto-precio">
                <small>Precio</small>
                <p>${product.price}</p>
              </div>
            <button data-id="${product._id}" class="delete-btn"><i class="bi bi-trash-fill delete-btn" style="color: red;" data-id="${product._id}"></i></button>
        `;
    list.prepend(li);
  });
  document.getElementById("product-count").textContent = `Total de productos: ${products.length}`;
});

// Agregar producto
const form = document.getElementById("add-product-form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const newProduct = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    price: Number(document.getElementById("price").value),
    thumbnail: document.getElementById("thumbnail").value,
    code: document.getElementById("code").value,
    stock: Number(document.getElementById("stock").value),
    category: document.getElementById("category").value,
  };
  socket.emit("addProduct", newProduct);
  form.reset();
});

// Eliminar producto
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.dataset.id;
    if (confirm("¿Seguro que deseas eliminar este producto?")) {
      socket.emit("deleteProduct", id);
    }
  }
});

// Oculto los botones de categoria
const linksCategorias = document.querySelectorAll(".boton-categoria");
const linkVolver = document.querySelector(".boton-volver");
linksCategorias.forEach((link) => {
  link.classList.add("disable");
});

// Muestro el boton de seguir comprando
linkVolver.classList.remove("disable");

// escondo el total del carrito
const contenidoCarrito = document.getElementById("boton-carrito");
contenidoCarrito.classList.add("disable");
