// e2e.test.js
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const jar = new CookieJar();
const http = wrapper(axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  jar,
  validateStatus: () => true, // no tires error por status != 2xx
}));

// Helpers
const ok = (msg) => console.log("✅", msg);
const bad = (msg) => console.log("❌", msg);
const sep = (t) => console.log("\n— " + t + " " + "—".repeat(Math.max(0, 60 - t.length)));

async function expectStatus(promise, expected, label) {
  const res = await promise;
  if (res.status === expected) ok(`${label} → ${res.status}`);
  else bad(`${label} → esperado ${expected} pero fue ${res.status} :: ${JSON.stringify(res.data)}`);
  return res;
}

function rid(prefix="x") { return `${prefix}_${Date.now()}_${Math.floor(Math.random()*1000)}`; }

(async () => {
  try {
    sep("SESSIONS");
    const email = `${rid("user")}@test.com`;
    const badEmail = `${rid("dup")}@test.com`;
    const password = "secret123";
    const wrongPassword = "nope";

    // 1) Register missing fields → 401 (passport "registro" devuelve 401 en tu helper)
    await expectStatus(
      http.post("/api/sessions/register", { email: badEmail, password, first_name: "A" }), // falta last_name y age
      401,
      "register faltan campos"
    );

    // 2) Register OK
    await expectStatus(
      http.post("/api/sessions/register", {
        email, password, first_name: "Ada", last_name: "Lovelace", age: 28
      }),
      200,
      "register ok"
    );

    // 3) Register duplicado → 401
    await expectStatus(
      http.post("/api/sessions/register", {
        email, password, first_name: "Ada", last_name: "Lovelace", age: 28
      }),
      401,
      "register duplicado"
    );

    // 4) Login mal → 401
    await expectStatus(
      http.post("/api/sessions/login", { email, password: wrongPassword }),
      401,
      "login credenciales inválidas"
    );

    // 5) Login OK (guarda cookieToken en el jar)
    await expectStatus(
      http.post("/api/sessions/login", { email, password }),
      200,
      "login ok"
    );

    // 6) Current OK (autenticado por cookie)
    await expectStatus(
      http.get("/api/sessions/current"),
      200,
      "current ok"
    );

    sep("PRODUCTS");
    const codeA = rid("codeA");
    const codeB = rid("codeB");
    let productA, productB;

    // 7) Crear producto A (stock 1) → 201
    productA = await expectStatus(
      http.post("/api/products", {
        title: "Prod A", description: "A", price: 10, code: codeA, stock: 1, category: "test", thumbnail: ""
      }),
      201,
      "crear producto A"
    ).then(r => r.data);

    // 8) Crear producto con mismo code → 400
    await expectStatus(
      http.post("/api/products", {
        title: "Otro", description: "dup", price: 10, code: codeA, stock: 2, category: "test"
      }),
      400,
      "crear duplicado code"
    );

    // 9) GET product id inválido → 400 (ensureObjectId)
    await expectStatus(
      http.get("/api/products/123"),
      400,
      "get product id inválido"
    );

    // 10) Update body vacío → 400
    await expectStatus(
      http.put(`/api/products/${productA._id}`, {}),
      400,
      "update body vacío"
    );

    // 11) Crear producto B (stock 100) → 201
    productB = await expectStatus(
      http.post("/api/products", {
        title: "Prod B", description: "B", price: 50, code: codeB, stock: 100, category: "test"
      }),
      201,
      "crear producto B"
    ).then(r => r.data);

    sep("CARTS");
    let cart;

    // 12) Crear carrito → 201
    cart = await expectStatus(
      http.post("/api/carts", {}),
      201,
      "crear carrito"
    ).then(r => r.data);

    // 13) Agregar qty=0 → 400
    await expectStatus(
      http.post(`/api/carts/${cart._id}/products/${productB._id}`, { qty: 0 }),
      400,
      "add product qty=0"
    );

    // 14) Agregar productId inválido → 400
    await expectStatus(
      http.post(`/api/carts/${cart._id}/products/123`, { qty: 1 }),
      400,
      "add product id inválido"
    );

    // 15) Agregar superando stock (A stock=1, pido 5) → 400
    await expectStatus(
      http.post(`/api/carts/${cart._id}/products/${productA._id}`, { qty: 5 }),
      400,
      "add product stock insuficiente"
    );

    // 16) Agregar ok (A qty=1) → 200
    await expectStatus(
      http.post(`/api/carts/${cart._id}/products/${productA._id}`, { qty: 1 }),
      200,
      "add product A ok"
    );

    // 17) Update qty con tipo incorrecto (string) → 400
    await expectStatus(
      http.put(`/api/carts/${cart._id}/products/${productA._id}`, { quantity: "cinco" }),
      400,
      "update qty tipo inválido"
    );

    // 18) Update qty negativo → 200 (elimina el producto del carrito)
    await expectStatus(
      http.put(`/api/carts/${cart._id}/products/${productA._id}`, { quantity: -3 }),
      200,
      "update qty negativo (elimina)"
    );

    // 19) Eliminar producto que no está → 404
    await expectStatus(
      http.delete(`/api/carts/${cart._id}/products/${productA._id}`),
      404,
      "remove product inexistente en carrito"
    );

    // 20) Totals → 200
    await expectStatus(
      http.get(`/api/carts/${cart._id}/totals`),
      200,
      "totals ok"
    );

    // 21) Estado inválido → 400
    await expectStatus(
      http.put(`/api/carts/${cart._id}/status`, { status: "desconocido" }),
      400,
      "status inválido"
    );

    // 22) Vaciar carrito → 200
    await expectStatus(
      http.delete(`/api/carts/${cart._id}`),
      200,
      "vaciar carrito"
    );

    sep("SESSIONS (logout)");
    // 23) Logout → 200
    await expectStatus(
      http.get("/api/sessions/logout"),
      200,
      "logout ok"
    );

    // 24) Current sin cookie → 401
    await expectStatus(
      http.get("/api/sessions/current"),
      401,
      "current sin cookie"
    );

    sep("LISTO");
  } catch (err) {
    console.error("💥 Error en tests:", err);
    process.exit(1);
  }
})();
