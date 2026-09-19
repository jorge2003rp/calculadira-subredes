/*
 * subnet.test.js
 * Tests automáticos para subnet.js. No usan ninguna librería externa,
 * solo el runner de tests que trae Node.js de serie.
 *
 * Cómo ejecutarlos:
 *   node --test
 * o, si tienes npm:
 *   npm test
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { parseIPv4, parseMask, toDotted, toBinary, calculateSubnet } = require("./subnet.js");

test("parseIPv4 acepta direcciones válidas y las convierte correctamente", () => {
  assert.equal(toDotted(parseIPv4("192.168.1.10")), "192.168.1.10");
  assert.equal(parseIPv4("0.0.0.0"), 0);
  assert.equal(parseIPv4("255.255.255.255"), 4294967295);
});

test("parseIPv4 rechaza formatos inválidos", () => {
  assert.equal(parseIPv4("192.168.1"), null); // faltan octetos
  assert.equal(parseIPv4("192.168.1.1.1"), null); // sobran octetos
  assert.equal(parseIPv4("256.0.0.1"), null); // octeto > 255
  assert.equal(parseIPv4("192.168.1.a"), null); // no numérico
  assert.equal(parseIPv4(""), null);
});

test("parseIPv4 rechaza ceros a la izquierda en los octetos", () => {
  assert.equal(parseIPv4("192.168.01.1"), null);
  assert.equal(parseIPv4("010.0.0.1"), null);
  assert.equal(parseIPv4("0.0.0.0"), 0); // un "0" suelto sigue siendo válido
});

test("parseMask acepta prefijo (con o sin ceros delante) y máscara en puntos", () => {
  assert.equal(parseMask("/24"), 24);
  assert.equal(parseMask("24"), 24);
  assert.equal(parseMask("032"), 32);
  assert.equal(parseMask("255.255.255.0"), 24);
  assert.equal(parseMask("255.255.240.0"), 20);
  assert.equal(parseMask("0.0.0.0"), 0);
  assert.equal(parseMask("255.255.255.255"), 32);
});

test("parseMask rechaza máscaras no contiguas o fuera de rango", () => {
  assert.equal(parseMask("255.0.255.0"), null);
  assert.equal(parseMask("/33"), null);
  assert.equal(parseMask("abc"), null);
});

test("toBinary siempre devuelve 32 caracteres", () => {
  assert.equal(toBinary(0), "0".repeat(32));
  assert.equal(toBinary(parseIPv4("255.255.255.255")), "1".repeat(32));
});

test("calculateSubnet: caso típico /24", () => {
  const r = calculateSubnet("192.168.1.10", "/24");
  assert.equal(r.ok, true);
  assert.equal(r.network, "192.168.1.0");
  assert.equal(r.broadcast, "192.168.1.255");
  assert.equal(r.firstHost, "192.168.1.1");
  assert.equal(r.lastHost, "192.168.1.254");
  assert.equal(r.hostCount, 254);
  assert.equal(r.warning, "");
});

test("calculateSubnet: /31 es un enlace punto a punto sin red ni broadcast reservados", () => {
  const r = calculateSubnet("10.1.1.0", "/31");
  assert.equal(r.ok, true);
  assert.equal(r.firstHost, "10.1.1.0");
  assert.equal(r.lastHost, "10.1.1.1");
  assert.equal(r.hostCount, 2);
});

test("calculateSubnet: /32 es un único equipo", () => {
  const r = calculateSubnet("10.1.1.5", "/32");
  assert.equal(r.ok, true);
  assert.equal(r.firstHost, "10.1.1.5");
  assert.equal(r.lastHost, "10.1.1.5");
  assert.equal(r.hostCount, 1);
});

test("calculateSubnet: /0 abarca toda la red", () => {
  const r = calculateSubnet("8.8.8.8", "/0");
  assert.equal(r.ok, true);
  assert.equal(r.network, "0.0.0.0");
  assert.equal(r.broadcast, "255.255.255.255");
  assert.equal(r.hostCount, Math.pow(2, 32) - 2);
});

test("calculateSubnet: avisa si la IP escrita es la de red o la de broadcast", () => {
  const red = calculateSubnet("192.168.1.0", "/24");
  assert.match(red.warning, /dirección de red/);

  const broadcast = calculateSubnet("192.168.1.255", "/24");
  assert.match(broadcast.warning, /broadcast/);

  const normal = calculateSubnet("192.168.1.10", "/24");
  assert.equal(normal.warning, "");
});

test("calculateSubnet: devuelve error con entradas inválidas", () => {
  const badIp = calculateSubnet("300.1.1.1", "/24");
  assert.equal(badIp.ok, false);

  const badMask = calculateSubnet("192.168.1.1", "/40");
  assert.equal(badMask.ok, false);
});
