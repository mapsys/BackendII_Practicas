// e2e.test.js
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

// ---------- Config ----------
const BASE_URL = process.env.BASE_URL || "http://localhost:8080";

// ---------- HTTP clients ----------
function makeClient(baseURL = BASE_URL) {
  const jar = new CookieJar();
  const http = wrapper(
    axios.create({
      baseURL,
      withCredentials: true,
      jar,
      validateStatus: () => true, // no throw en != 2xx
    })
  );
  return { http, jar };
}

const { http: httpAnon } = makeClient(); // sin cookies
const { http: httpUser } = makeClient(); // user normal
const { http: httpAdmin } = makeClient(); // admin

// ---------- Helpers ----------
const ok = (msg) => console.log("✅", msg);
const bad = (msg) => console.log("❌", msg);
const sep = (t) => console.log("\n— " + t + " " + "—".repeat(Math.max(0, 60 - t.length)));

async function expectStatus(promise, expected, label) {
  const res = await promise;
  if (res.status === expected) ok(`${label} → ${res.status}`);
  else bad(`${label} → esperado ${expected} pero fue ${res.status} :: ${JSON.stringify(res.data)}`);
  return res;
}

async function expectOneOf(promise, expectedArr, label) {
  const res = await promise;
  if (expectedArr.includes(res.status)) ok(`${label} → ${res.status}`);
  else bad(`${label} → esperado uno de [${expectedArr.join(", ")}] pero fue ${res.status} :: ${JSON.stringify(res.data)}`);
  return res;
}

function rid(prefix = "x") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// random ObjectId válido (24 hex) que casi seguro NO existe en tu DB
function randomObjectId() {
  const hex = "0123456789abcdef";
  let id = "";
  for (let i = 0; i < 24; i++) id += hex[Math.floor(Math.random() * 16)];
  return id;
}

// Helpers de lectura específicos
async function getProduct(http, id) {
  const r = await http.get(`/api/products/${id}`);
  return { status: r.status, data: r.data };
}

async function getCart(http, id) {
  const r = await http.get(`/api/carts/${id}`);
  return { status: r.status, data: r.data };
}

(async () => {
  try {
    // ---------------- SESSIONS (USER) ----------------
    sep("SESSIONS (USER)");
    const userEmail = `${rid("user")}@test.com`;
    const userPass = "secret123";

    // Register con campos faltantes → 401 (passport registro)
    await expectStatus(httpUser.post("/api/sessions/register", { email: `${rid("bad")}@test.com`, password: userPass, first_name: "A" }), 401, "register faltan campos (user)");

    // Register OK (201)
    await expectStatus(
      httpUser.post("/api/sessions/register", {
        email: userEmail,
        password: userPass,
        first_name: "Ada",
        last_name: "Lovelace",
        age: 28,
      }),
      201,
      "register ok (user)"
    );

    // Register duplicado → 401
    await expectStatus(
      httpUser.post("/api/sessions/register", {
        email: userEmail,
        password: userPass,
        first_name: "Ada",
        last_name: "Lovelace",
        age: 28,
      }),
      401,
      "register duplicado (user)"
    );

    // Login mal → 401
    await expectStatus(httpUser.post("/api/sessions/login", { email: userEmail, password: "nope" }), 401, "login credenciales inválidas (user)");

    // Login OK
    await expectStatus(httpUser.post("/api/sessions/login", { email: userEmail, password: userPass }), 200, "login ok (user)");

    // Current OK
    await expectStatus(httpUser.get("/api/sessions/current"), 200, "current ok (user)");

    // ---------------- PRODUCTS: auth/roles ----------------
    sep("PRODUCTS (auth/roles)");

    const codeA = rid("codeA");
    const codeB = rid("codeB");
    let productA, productB;

    // Crear producto sin cookie → 401/403
    await expectOneOf(
      httpAnon.post("/api/products", {
        title: "Anon Prod",
        description: "X",
        price: 10,
        code: rid("codeAnon"),
        stock: 1,
        category: "test",
      }),
      [401, 403],
      "crear producto sin login"
    );

    // Crear producto con user no-admin → 401/403
    await expectOneOf(
      httpUser.post("/api/products", {
        title: "User Prod",
        description: "X",
        price: 10,
        code: rid("codeUser"),
        stock: 1,
        category: "test",
      }),
      [401, 403],
      "crear producto con user no admin"
    );

    // ---------------- SESSIONS (ADMIN) ----------------
    sep("SESSIONS (ADMIN)");
    const adminEmail = `${rid("admin")}@coder.com`; // tu lógica: @coder.com => admin
    const adminPass = "secret123";

    // Register admin OK (201)
    await expectStatus(
      httpAdmin.post("/api/sessions/register", {
        email: adminEmail,
        password: adminPass,
        first_name: "Root",
        last_name: "Admin",
        age: 33,
      }),
      201,
      "register ok (admin)"
    );

    // Login admin OK
    await expectStatus(httpAdmin.post("/api/sessions/login", { email: adminEmail, password: adminPass }), 200, "login ok (admin)");

    // Current admin OK
    await expectStatus(httpAdmin.get("/api/sessions/current"), 200, "current ok (admin)");

    // ---------------- PRODUCTS (admin) ----------------
    sep("PRODUCTS (admin happy path + errores)");

    // Crear producto A (stock 1) → 201
    productA = await expectStatus(
      httpAdmin.post("/api/products", {
        title: "Prod A",
        description: "A",
        price: 10,
        code: codeA,
        stock: 1,
        category: "test",
        thumbnail: "",
      }),
      201,
      "crear producto A (admin)"
    ).then((r) => r.data);

    // Crear duplicado (mismo code) → 400
    await expectStatus(
      httpAdmin.post("/api/products", {
        title: "Otro",
        description: "dup",
        price: 20,
        code: codeA,
        stock: 2,
        category: "test",
      }),
      400,
      "crear duplicado code (admin)"
    );

    // Crear con missing fields → 400
    await expectStatus(
      httpAdmin.post("/api/products", {
        title: "SinCampos",
        price: 10,
        code: rid("missing"),
        stock: 1,
        // falta description/category
      }),
      400,
      "crear producto con campos faltantes (admin)"
    );

    // Precio 0 → 400
    await expectStatus(
      httpAdmin.post("/api/products", {
        title: "PrecioCero",
        description: "X",
        price: 0,
        code: rid("p0"),
        stock: 1,
        category: "test",
      }),
      400,
      "crear con precio 0 (admin)"
    );

    // Stock negativo → 400
    await expectStatus(
      httpAdmin.post("/api/products", {
        title: "StockNeg",
        description: "X",
        price: 10,
        code: rid("sneg"),
        stock: -5,
        category: "test",
      }),
      400,
      "crear con stock negativo (admin)"
    );

    // GET product id inválido → 400 (si tenés ensureObjectId)
    await expectStatus(httpAdmin.get("/api/products/123"), 400, "get product id inválido");

    // Update body vacío → 400
    await expectStatus(httpAdmin.put(`/api/products/${productA.id || productA._id}`, {}), 400, "update body vacío");

    // Crear producto B (stock 100) → 201
    productB = await expectStatus(
      httpAdmin.post("/api/products", {
        title: "Prod B",
        description: "B",
        price: 50,
        code: codeB,
        stock: 100,
        category: "test",
      }),
      201,
      "crear producto B (admin)"
    ).then((r) => r.data);

    // Update con campo inválido → 400
    await expectStatus(httpAdmin.put(`/api/products/${productB.id || productB._id}`, { foo: "bar" }), 400, "update con campo inválido");

    // ---------------- CARTS ----------------
    sep("CARTS");

    // Crear carrito → 201
    const cart = await expectStatus(httpUser.post("/api/carts", {}), 201, "crear carrito").then((r) => r.data);

    // Agregar qty=0 → 400
    await expectStatus(httpUser.post(`/api/carts/${cart._id || cart.id}/products/${productB.id || productB._id}`, { qty: 0 }), 400, "add product qty=0");

    // Agregar productId inválido → 400
    await expectStatus(httpUser.post(`/api/carts/${cart._id || cart.id}/products/123`, { qty: 1 }), 400, "add product id inválido");

    // Agregar producto inexistente → 400/404
    await expectOneOf(httpUser.post(`/api/carts/${cart._id || cart.id}/products/${randomObjectId()}`, { qty: 1 }), [400, 404], "add product id válido pero inexistente");

    // Agregar superando stock (A stock=1, pido 5) → 400
    await expectStatus(httpUser.post(`/api/carts/${cart._id || cart.id}/products/${productA.id || productA._id}`, { qty: 5 }), 400, "add product stock insuficiente");

    // Agregar ok (A qty=1) → 200
    await expectStatus(httpUser.post(`/api/carts/${cart._id || cart.id}/products/${productA.id || productA._id}`, { qty: 1 }), 200, "add product A ok");

    // Update qty string → 400
    await expectStatus(httpUser.put(`/api/carts/${cart._id || cart.id}/products/${productA.id || productA._id}`, { quantity: "cinco" }), 400, "update qty tipo inválido");

    // Update qty negativo → 200 (elimina)
    await expectStatus(httpUser.put(`/api/carts/${cart._id || cart.id}/products/${productA.id || productA._id}`, { quantity: -3 }), 200, "update qty negativo (elimina)");

    // Eliminar producto que no está → 404
    await expectStatus(httpUser.delete(`/api/carts/${cart._id || cart.id}/products/${productA.id || productA._id}`), 404, "remove product inexistente en carrito");

    // Totals → 200
    await expectStatus(httpUser.get(`/api/carts/${cart._id || cart.id}/totals`), 200, "totals ok");

    // Estado inválido → 400
    await expectStatus(httpUser.put(`/api/carts/${cart._id || cart.id}/status`, { status: "desconocido" }), 400, "status inválido");

    // Vaciar carrito → 200
    await expectStatus(httpUser.delete(`/api/carts/${cart._id || cart.id}`), 200, "vaciar carrito");

    // ---------------- STOCK & PURCHASE ----------------
    sep("STOCK & PURCHASE");

    // Creamos producto C (stock 3, price 100)
    const codeC = rid("codeC");
    const productC = await expectStatus(
      httpAdmin.post("/api/products", {
        title: "Prod C",
        description: "C",
        price: 100,
        code: codeC,
        stock: 3,
        category: "test",
      }),
      201,
      "crear producto C (admin)"
    ).then((r) => r.data);

    // Carrito 2 para este flujo
    const cart2 = await expectStatus(httpUser.post("/api/carts", {}), 201, "crear carrito 2").then((r) => r.data);

    // Intento setear cantidad por encima del stock vía UPDATE → 400
    await expectStatus(httpUser.put(`/api/carts/${cart2._id || cart2.id}/products/${productC._id || productC.id}`, { quantity: 10 }), 400, "update qty > stock (debe fallar)");

    // Agrego qty=2 OK
    await expectStatus(httpUser.post(`/api/carts/${cart2._id || cart2.id}/products/${productC._id || productC.id}`, { qty: 2 }), 200, "add product C qty=2 ok");

    // Bajo stock del producto a 1 para forzar compra fallida
    await expectStatus(httpAdmin.put(`/api/products/${productC._id || productC.id}`, { stock: 1 }), 200, "bajar stock C a 1 (admin)");

    // Intento comprar → debe fallar 400 por stock insuficiente
    await expectStatus(httpUser.put(`/api/carts/${cart2._id || cart2.id}/status`, { status: "comprado" }), 400, "comprar con stock insuficiente (debe fallar)");

    // El carrito debe seguir activo y con productos
    const readCartAfterFail = await getCart(httpUser, cart2._id || cart2.id);
    if (readCartAfterFail.status === 200) {
      const c = readCartAfterFail.data;
      if ((c.status || c.estado) === "activo" && Array.isArray(c.products) && c.products.length > 0) {
        ok("carrito sigue activo y con productos tras compra fallida");
      } else {
        bad("carrito NO quedó activo o quedó vacío tras compra fallida");
      }
    } else {
      bad("no pude leer carrito tras compra fallida");
    }

    // Subo stock a 5 y compro de nuevo → 200
    const beforeProd = await getProduct(httpAdmin, productC._id || productC.id);
    const stockBefore = beforeProd.status === 200 ? beforeProd.data.stock ?? beforeProd.data?.payload?.stock : undefined;

    await expectStatus(httpAdmin.put(`/api/products/${productC._id || productC.id}`, { stock: 5 }), 200, "subir stock C a 5 (admin)");

    await expectStatus(httpUser.put(`/api/carts/${cart2._id || cart2.id}/status`, { status: "comprado" }), 200, "comprar OK con stock suficiente");

    // Verifico carrito comprado
    const readCartAfterOk = await getCart(httpUser, cart2._id || cart2.id);
    if (readCartAfterOk.status === 200) {
      const c = readCartAfterOk.data;
      if ((c.status || c.estado) === "comprado") ok("carrito marcado como comprado");
      else bad("carrito NO quedó como 'comprado'");
    }

    // Verifico que stock haya decrementado en 2 (si tu backend descuenta stock al comprar)
    const afterProd = await getProduct(httpAdmin, productC._id || productC.id);
    if (afterProd.status === 200 && typeof stockBefore === "number") {
      const stockAfter = afterProd.data.stock ?? afterProd.data?.payload?.stock;
      if (typeof stockAfter === "number" && stockAfter === stockBefore - 2) {
        ok(`stock decrementado correctamente (${stockBefore} -> ${stockAfter})`);
      } else {
        bad(`stock no se decrementó como se esperaba. Antes=${stockBefore}, Después=${stockAfter}`);
      }
    }

    // ---------------- PRODUCTS delete (roles) ----------------
    sep("PRODUCTS DELETE (roles)");

    // Borrar producto con user no-admin → 401/403
    await expectOneOf(httpUser.delete(`/api/products/${productB.id || productB._id}`), [401, 403], "delete product con user no admin");

    // Borrar product id inválido con admin → 400
    await expectStatus(httpAdmin.delete("/api/products/123"), 400, "delete id inválido (admin)");

    // Borrar OK con admin → 200/204
    await expectOneOf(httpAdmin.delete(`/api/products/${productB.id || productB._id}`), [200, 204], "delete product B (admin)");

    // ---------------- LOGOUTS ----------------
    sep("SESSIONS (logout)");
    await expectStatus(httpUser.get("/api/sessions/logout"), 200, "logout ok (user)");
    await expectStatus(httpAdmin.get("/api/sessions/logout"), 200, "logout ok (admin)");

    // Current sin cookie → 401/403
    await expectOneOf(httpAnon.get("/api/sessions/current"), [401, 403], "current sin cookie");

    sep("LISTO ✅");
  } catch (err) {
    console.error("💥 Error en tests:", err);
    process.exit(1);
  }
})();
