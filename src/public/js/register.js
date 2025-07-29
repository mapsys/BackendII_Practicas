async function enviarRegistro(data) {
  try {
    const res = await fetch("/api/sessions/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const msg = document.getElementById("registerMessage");

    if (res.ok) {
      msg.textContent = "Registro exitoso. Redirigiendo...";
      setTimeout(() => (window.location.href = "/"), 1000);
    } else {
      const { error } = await res.json();
      msg.textContent = "Error: " + (error || "No se pudo registrar");
    }
  } catch (err) {
    console.error("Error en el registro:", err);
  }
}

function conectarRegisterForm() {
  const form = document.getElementById("registerForm");
  const msg = document.getElementById("registerMessage");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    /* 1️⃣  ¿formulario válido? */
    if (!form.checkValidity()) {
      // --- Chequeamos SOLO el email ---
      if (!email.validity.valid) {
        msg.textContent = email.validity.valueMissing ? "El e-mail es obligatorio" : "El e-mail debe tener un dominio válido (ej. usuario@dominio.com)";
      }

      // Opcional: mostrale al usuario la burbuja nativa además de tu div
      form.reportValidity();
      return; // aborta el envío
    }
    const data = {
      first_name: form.name.value,
      last_name: form.lastName.value,
      email: form.email.value,
      password: form.password.value,
      age: form.age.value,
    };
    await enviarRegistro(data);
  });
}
async function main() {
  conectarRegisterForm();
}
main();
