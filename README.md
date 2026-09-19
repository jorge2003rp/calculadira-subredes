# Calculadora de subredes IPv4

Aplicación web que calcula los datos de una subred a partir de una dirección IP y su máscara, y muestra en binario qué bits pertenecen a la red y cuáles a los equipos.

## Demo

[https://jorge2003rp.github.io/calculadora-subredes](https://jorge2003rp.github.io/calculadora-subredes)

## Qué calcula

- Dirección de red y dirección de broadcast
- Máscara en formato decimal y en prefijo, y máscara wildcard
- Primer y último equipo utilizable, y número de equipos por subred
- Tipo de dirección (privada, pública, loopback, multicast...) y clase histórica
- Representación binaria de la IP y de la máscara, con los bits de red y de equipos en distinto color

La máscara se puede escribir como `/24`, `24` o `255.255.255.0`. Además:

- Valida la IP y la máscara, y avisa si la máscara no es contigua (por ejemplo `255.0.255.0`).
- Trata los casos especiales `/31` (enlace punto a punto) y `/32` (equipo único).
- Avisa si la IP introducida es la dirección de red o de broadcast de su subred.

## Tecnologías

HTML, CSS y JavaScript, sin librerías externas.

## Cómo usarlo

Con la demo online no hace falta instalar nada. Para ejecutarlo en local:

1. Clona el repositorio: `git clone https://github.com/jorge2003rp/calculadora-subredes.git`
2. Abre `index.html` en el navegador.

## Estructura

```
calculadora-subredes/
├── index.html   # Estructura de la página
├── style.css    # Estilos
├── subnet.js    # Lógica del cálculo (independiente de la página)
├── app.js       # Conecta el formulario con la lógica y pinta el resultado
└── README.md
```

La lógica está separada de la interfaz a propósito: `subnet.js` no toca la página, por lo que se puede probar por separado (por ejemplo con Node.js).

## Cómo funciona

Una dirección IPv4 son 32 bits, así que el programa la guarda como un número entero y usa operaciones a nivel de bit:

- **Dirección de red** = IP `&` máscara (se ponen a 0 los bits de equipo)
- **Wildcard** = `~`máscara (la máscara invertida)
- **Broadcast** = red `|` wildcard (se ponen a 1 los bits de equipo)
- **Número de equipos** = 2^(bits de equipo) − 2 (se restan la dirección de red y la de broadcast)

## Qué aprendí

<!-- Revisa este apartado y déjalo solo con lo que sea cierto en tu caso -->
- Cómo se relacionan la IP, la máscara y el prefijo, y cómo se calcula cada dirección de la subred con operaciones a nivel de bit.
- Que en JavaScript las operaciones de bits trabajan con enteros de 32 bits con signo, y que hay que usar `>>> 0` para obtener el valor sin signo.
- Casos límite del subnetting: `/0`, `/31` y `/32`.
- A separar la lógica de la interfaz y a validar la entrada del usuario.

## Posibles mejoras

- Soporte para IPv6
- Calcular varias subredes a partir de una red mayor (VLSM)
- Botón para copiar los resultados
- Tests automáticos para `subnet.js`
