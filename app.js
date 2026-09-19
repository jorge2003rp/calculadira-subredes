/*
 * app.js
 * Conecta el formulario con la lógica de subnet.js y pinta el resultado.
 * Necesita que subnet.js se cargue antes (ver index.html).
 */

const $ = (id) => document.getElementById(id);

const form = $("form");
const ipInput = $("ip");
const maskInput = $("mask");
const errorBox = $("error");
const resultBox = $("result");
const warningBox = $("warning");

/**
 * Dibuja los 32 bits en 4 grupos de 8 (octetos).
 * Los 'prefix' primeros bits son de red y el resto de equipos.
 */
function renderBits(container, value, prefix) {
  const bits = toBinary(value);
  container.replaceChildren(); // vacía el contenedor

  for (let octetIndex = 0; octetIndex < 4; octetIndex++) {
    const octet = document.createElement("span");
    octet.className = "octet";

    for (let i = 0; i < 8; i++) {
      const position = octetIndex * 8 + i;
      const bit = document.createElement("span");
      bit.className = "bit " + (position < prefix ? "net" : "host");
      bit.textContent = bits[position];
      octet.appendChild(bit);
    }
    container.appendChild(octet);
  }
}

/** Muestra los resultados en la página */
function renderResult(r) {
  $("ip-dotted").textContent = toDotted(r.ip);
  $("mask-dotted-label").textContent = r.maskDotted + "  (/" + r.prefix + ")";
  renderBits($("ip-bits"), r.ip, r.prefix);
  renderBits($("mask-bits"), r.mask, r.prefix);

  $("net-count").textContent = r.networkBits;
  $("host-count").textContent = r.hostBits;

  $("r-network").textContent = r.network;
  $("r-broadcast").textContent = r.broadcast;
  $("r-mask").textContent = r.maskDotted + " (/" + r.prefix + ")";
  $("r-wildcard").textContent = r.wildcard;
  $("r-first").textContent = r.firstHost;
  $("r-last").textContent = r.lastHost;

  // Separador de miles en español (16.777.214)
  let hosts = r.hostCount.toLocaleString("es-ES");
  if (r.hostNote) hosts += " (" + r.hostNote.toLowerCase() + ")";
  $("r-hosts").textContent = hosts;

  $("r-type").textContent = r.type;
  $("r-class").textContent = r.className;

  warningBox.hidden = !r.warning;
  warningBox.textContent = r.warning;

  resultBox.hidden = false;
}

/**
 * Calcula con lo que haya escrito.
 * showError = true cuando el usuario pulsa "Calcular"; mientras escribe no
 * queremos molestarle con errores a medias.
 */
function calculate(showError) {
  const r = calculateSubnet(ipInput.value, maskInput.value);

  if (r.ok) {
    errorBox.hidden = true;
    renderResult(r);
  } else if (showError) {
    errorBox.textContent = r.error;
    errorBox.hidden = false;
    resultBox.hidden = true;
  }
}

// Al pulsar "Calcular" o Enter
form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculate(true);
});

// Resultado en vivo mientras se escribe
ipInput.addEventListener("input", () => calculate(false));
maskInput.addEventListener("input", () => calculate(false));

// Botones de ejemplo
document.querySelectorAll(".example").forEach((button) => {
  button.addEventListener("click", () => {
    ipInput.value = button.dataset.ip;
    maskInput.value = button.dataset.mask;
    calculate(true);
  });
});

// Cálculo inicial con los valores por defecto
calculate(true);
