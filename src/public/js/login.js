async function enviarLogin(data) {
  try {
    const res = await fetch("/api/sessions/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const msg = document.getElementById("loginMessage");

    if (res.ok) {
      msg.textContent = "¡Bienvenido!";
      setTimeout(() => (window.location.href = "/"), 1000);
    } else {
      const { error } = await res.json();
      msg.textContent = "Error: " + (error || "Credenciales inválidas");
    }
  } catch (err) {
    console.error("Error en el login:", err);
  }
}

function conectarLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      email: form.email.value,
      password: form.password.value,
    };

    await enviarLogin(data);
  });
}

export async function main() {
  conectarLoginForm();
}
main();
