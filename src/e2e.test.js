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

(async () => {
  try {
    // ---------------- SESSIONS (USER) ----------------
    sep("SESSIONS (USER)");
    const userEmail = `${rid("user")}@test.com`;
    const userPass = "secret123";

    // Register con campos faltantes → 401 (passport registro)
    await expectStatus(httpUser.post("/api/sessions/register", { email: `${rid("bad")}@test.com`, password: userPass, first_name: "A" }), 401, "register faltan campos (user)");

    // Register OK
    await expectStatus(
      httpUser.post("/api/sessions/register", {
        email: userEmail,
        password: userPass,
        first_name: "Ada",
        last_name: "Lovelace",
        age: 28,
      }),
      200,
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

    // Crear producto sin cookie → 401 (no autenticado)
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

    // Crear producto con user no-admin → 401/403 (forbidden)
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

    // Register admin OK
    await expectStatus(
      httpAdmin.post("/api/sessions/register", {
        email: adminEmail,
        password: adminPass,
        first_name: "Root",
        last_name: "Admin",
        age: 33,
      }),
      200,
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

    // Crear carrito → 201 (según tu router puede o no requerir login)
    const cart = await expectStatus(httpUser.post("/api/carts", {}), 201, "crear carrito").then((r) => r.data);

    // Agregar qty=0 → 400
    await expectStatus(httpUser.post(`/api/carts/${cart._id || cart.id}/products/${productB.id || productB._id}`, { qty: 0 }), 400, "add product qty=0");

    // Agregar productId inválido → 400
    await expectStatus(httpUser.post(`/api/carts/${cart._id || cart.id}/products/123`, { qty: 1 }), 400, "add product id inválido");

    // Agregar producto inexistente (ObjectId válido aleatorio) → 404 o 400 según tu servicio
    await expectOneOf(httpUser.post(`/api/carts/${cart._id || cart.id}/products/${randomObjectId()}`, { qty: 1 }), [400, 404], "add product id válido pero inexistente");

    // Agregar superando stock (A stock=1, pido 5) → 400
    await expectStatus(httpUser.post(`/api/carts/${cart._id || cart.id}/products/${productA.id || productA._id}`, { qty: 5 }), 400, "add product stock insuficiente");

    // Agregar ok (A qty=1) → 200
    await expectStatus(httpUser.post(`/api/carts/${cart._id || cart.id}/products/${productA.id || productA._id}`, { qty: 1 }), 200, "add product A ok");

    // Update qty string → 400
    await expectStatus(httpUser.put(`/api/carts/${cart._id || cart.id}/products/${productA.id || productA._id}`, { quantity: "cinco" }), 400, "update qty tipo inválido");

    // Update qty negativo → 200 (lo elimina del carrito)
    await expectStatus(httpUser.put(`/api/carts/${cart._id || cart.id}/products/${productA.id || productA._id}`, { quantity: -3 }), 200, "update qty negativo (elimina)");

    // Eliminar producto que no está → 404
    await expectStatus(httpUser.delete(`/api/carts/${cart._id || cart.id}/products/${productA.id || productA._id}`), 404, "remove product inexistente en carrito");

    // Totals → 200
    await expectStatus(httpUser.get(`/api/carts/${cart._id || cart.id}/totals`), 200, "totals ok");

    // Estado inválido → 400
    await expectStatus(httpUser.put(`/api/carts/${cart._id || cart.id}/status`, { status: "desconocido" }), 400, "status inválido");

    // Vaciar carrito → 200
    await expectStatus(httpUser.delete(`/api/carts/${cart._id || cart.id}`), 200, "vaciar carrito");

    // ---------------- PRODUCTS delete (roles) ----------------
    sep("PRODUCTS DELETE (roles)");

    // Borrar producto con user no-admin → 401/403
    await expectOneOf(httpUser.delete(`/api/products/${productB.id || productB._id}`), [401, 403], "delete product con user no admin");

    // Borrar product id inválido con admin → 400
    await expectStatus(httpAdmin.delete("/api/products/123"), 400, "delete id inválido (admin)");

    // Borrar OK con admin → 200
    await expectOneOf(
      httpAdmin.delete(`/api/products/${productB.id || productB._id}`),
      [200, 204], // según cómo respondas
      "delete product B (admin)"
    );

    // ---------------- LOGOUTS ----------------
    sep("SESSIONS (logout)");

    await expectStatus(httpUser.get("/api/sessions/logout"), 200, "logout ok (user)");
    await expectStatus(httpAdmin.get("/api/sessions/logout"), 200, "logout ok (admin)");

    // Current sin cookie → 401
    await expectOneOf(httpAnon.get("/api/sessions/current"), [401, 403], "current sin cookie");

    sep("LISTO ✅");
  } catch (err) {
    console.error("💥 Error en tests:", err);
    process.exit(1);
  }
})();
