/*
 * subnet.js
 * Lógica del cálculo de subredes IPv4. No toca la página (eso lo hace app.js),
 * así se puede probar por separado y es más fácil de entender.
 *
 * Idea clave: una dirección IPv4 son 32 bits. Guardamos cada dirección como un
 * número entero de 32 bits y usamos operaciones a nivel de bit (&, |, ~).
 */

/**
 * Convierte "192.168.1.10" en un número de 32 bits.
 * Devuelve null si el texto no es una IPv4 válida.
 */
function parseIPv4(text) {
  const parts = text.trim().split(".");
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    // Solo dígitos, entre 1 y 3 caracteres
    if (!/^\d{1,3}$/.test(part)) return null;
    // Sin ceros a la izquierda ("01" es ambiguo: algunos sistemas lo leen
    // como octal, así que mejor exigir la forma decimal normal).
    if (part.length > 1 && part[0] === "0") return null;
    const n = Number(part);
    if (n > 255) return null;
    value = value * 256 + n; // desplaza 8 bits y añade el octeto
  }
  return value;
}

/**
 * Acepta "/24", "24" o "255.255.255.0" y devuelve la longitud del prefijo (0-32).
 * Devuelve null si la máscara no es válida.
 */
function parseMask(text) {
  const clean = text.trim().replace(/^\//, "");

  // Caso 1: prefijo numérico (24, o con ceros delante como 032)
  if (/^\d{1,3}$/.test(clean)) {
    const prefix = Number(clean);
    return prefix <= 32 ? prefix : null;
  }

  // Caso 2: máscara en decimal con puntos (255.255.255.0)
  const mask = parseIPv4(clean);
  if (mask === null) return null;

  // Una máscara válida son unos seguidos de ceros (11111111.11111111.11111111.00000000).
  // Si invertimos los bits, debe quedar ceros seguidos de unos (2^n - 1),
  // y un número de la forma 2^n - 1 cumple: x & (x + 1) === 0.
  const inverted = (~mask) >>> 0;
  if ((inverted & (inverted + 1)) !== 0) return null;

  // Contamos los unos que tiene la máscara
  return mask.toString(2).replace(/0/g, "").length;
}

/** Número de 32 bits -> "192.168.1.10" */
function toDotted(n) {
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

/** Número de 32 bits -> cadena de 32 caracteres "0" y "1" */
function toBinary(n) {
  return n.toString(2).padStart(32, "0");
}

/** Tipo de dirección según su rango */
function addressType(ip) {
  const a = ip >>> 24;
  const b = (ip >>> 16) & 255;

  if (a === 10) return "Privada (10.0.0.0/8)";
  if (a === 172 && b >= 16 && b <= 31) return "Privada (172.16.0.0/12)";
  if (a === 192 && b === 168) return "Privada (192.168.0.0/16)";
  if (a === 127) return "Loopback (pruebas en el propio equipo)";
  if (a === 169 && b === 254) return "Link-local (autoasignada)";
  if (a === 0) return "Reservada (0.0.0.0/8)";
  if (a >= 224 && a <= 239) return "Multicast";
  if (a >= 240) return "Reservada";
  return "Pública";
}

/** Clase histórica (A, B, C, D o E) según el primer octeto */
function addressClass(ip) {
  const a = ip >>> 24;
  if (a < 128) return "A";
  if (a < 192) return "B";
  if (a < 224) return "C";
  if (a < 240) return "D (multicast)";
  return "E (reservada)";
}

/**
 * Función principal. Recibe los textos que escribe el usuario y devuelve
 * un objeto con todos los resultados, o { ok: false, error } si algo falla.
 */
function calculateSubnet(ipText, maskText) {
  const ip = parseIPv4(ipText);
  if (ip === null) {
    return {
      ok: false,
      error:
        "La dirección IP no es válida. Usa cuatro números entre 0 y 255 separados por puntos, por ejemplo 192.168.1.10.",
    };
  }

  const prefix = parseMask(maskText);
  if (prefix === null) {
    return {
      ok: false,
      error:
        "La máscara no es válida. Prueba con /24, con 24 o con 255.255.255.0.",
    };
  }

  // Máscara: 'prefix' unos seguidos de ceros.
  // Con prefijo 0 no se puede desplazar 32 posiciones en JavaScript, de ahí el caso aparte.
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;

  const network = (ip & mask) >>> 0; // pone a 0 los bits de equipo
  const wildcard = (~mask) >>> 0; // máscara invertida
  const broadcast = (network | wildcard) >>> 0; // pone a 1 los bits de equipo

  // Rango de equipos y cuántos caben
  let firstHost;
  let lastHost;
  let hostCount;
  let hostNote = "";

  if (prefix === 32) {
    // Una sola dirección: un único equipo
    firstHost = network;
    lastHost = network;
    hostCount = 1;
    hostNote = "Equipo único";
  } else if (prefix === 31) {
    // Enlaces punto a punto (RFC 3021): no se reservan red ni broadcast
    firstHost = network;
    lastHost = broadcast;
    hostCount = 2;
    hostNote = "Enlace punto a punto";
  } else {
    firstHost = network + 1;
    lastHost = broadcast - 1;
    hostCount = Math.pow(2, 32 - prefix) - 2; // restamos red y broadcast
  }

  // Aviso útil si la IP escrita no se puede asignar a un equipo
  let warning = "";
  if (prefix < 31 && ip === network) {
    warning = "Esta IP es la dirección de red de su subred, así que no se puede asignar a un equipo.";
  } else if (prefix < 31 && ip === broadcast) {
    warning = "Esta IP es la dirección de broadcast de su subred, así que no se puede asignar a un equipo.";
  }

  return {
    ok: true,
    ip,
    prefix,
    mask,
    networkBits: prefix,
    hostBits: 32 - prefix,
    network: toDotted(network),
    broadcast: toDotted(broadcast),
    maskDotted: toDotted(mask),
    wildcard: toDotted(wildcard),
    firstHost: toDotted(firstHost),
    lastHost: toDotted(lastHost),
    hostCount,
    hostNote,
    type: addressType(ip),
    className: addressClass(ip),
    warning,
  };
}

// Permite probar este archivo con Node.js sin afectar al navegador
if (typeof module !== "undefined") {
  module.exports = { parseIPv4, parseMask, toDotted, toBinary, calculateSubnet };
}
