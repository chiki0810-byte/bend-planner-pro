# Auditoría (solo lectura) — PlieguesPorPuntaPage.tsx

No se modificó ningún archivo del proyecto. Solo se escribió este informe del plan. Las conclusiones salen de leer el código y de aritmética directa; no se ejecutó nada en el navegador ni pruebas nuevas.

## 1. La contradicción (CONFIRMADO)

`src/pages/PlieguesPorPuntaPage.tsx`
- L42-52 `calcPliegue`: `ba = θrad·(R + K·t)`, `comp = longitud + ba`, `desarrollo = comp` (**suma** BA).
- L95-105 `desarrolloPuntaA/B = ΣL − ΣBA` (**resta** BA).
- L107 `desarrolloTotal = A + B`.
- L173-175: cada pliegue muestra "Desarrollo" = L + BA; L290-292: los totales muestran ΣL − BA. Con un solo pliegue, la misma pantalla muestra a la vez L+BA y L−BA.

Ejemplo (valores iniciales R=1.0, K=0.5, t=1.0; L=50, 90°): BA = 2.356; pliegue "Desarrollo" 52.356; "Desarrollo Punta A" 47.644.

Otro punto encontrado (CONTRADICCIÓN con Fase 1): L57-59, K=0.5 y R=1.0 están fijos en el código y no usan `getMaterialDefaultsByThickness`; L33-40, la lista de materiales ("Acero Dulce"...) no son los 9 materiales genéricos. Queda fuera de alcance; solo se deja anotado.

## 2. Valores reales del formulario (L118-137, L214-242)

| Campo | Atributos | Lo que hace el código | ¿Lo permite la interfaz? |
|---|---|---|---|
| Longitud | min=0, step=0.1 | `parseFloat(v) \|\| 0` | 0: sí (valor inicial al añadir, L64/L67). Negativos: se pueden escribir (`min` no bloquea lo que se teclea y no hay comprobación). |
| Ángulo | min=0, max=180 | `parseFloat(v) \|\| 0` | 0..180 con las flechas; se pueden escribir valores >180 o negativos. Valor inicial: 90. |
| Espesor / R | min=0 | `\|\| 0` | Se pueden escribir 0 y negativos. |
| K | min=0, max=0.5 | `\|\| 0` | Se pueden escribir valores fuera de rango. |
| Campo vacío o NaN | — | se convierte en 0 | Sí (al borrar el campo). |

No hay ninguna otra comprobación de rangos en la página. Los rangos que existen después (ala <10, ángulo >130/160) están en `validarPieza.ts` L60-92, no en esta página.

Cómo se comportan los cálculos (aritmética sobre L42-107):
- Cero pliegues (por defecto en ambas puntas): A=B=Total=0.
- Añadir un pliegue sin editar (L=0, 90°): Punta = −2.356, Total negativo → **CONFIRMADO: se puede mostrar un desarrollo negativo desde el estado inicial**.
- Ángulo 0° (o R=K=0): BA=0, así que ΣL−BA = ΣL+BA y la contradicción desaparece.
- Ángulo 180°: BA = π·(R+K·t) = 4.712 con los valores iniciales.
- Varios pliegues: la diferencia entre los dos criterios es 2·ΣBA y crece con cada pliegue.
- Una punta vacía: esa punta da 0 y el total es igual a la otra punta.
- Valores negativos: dan BA o L negativos y se calculan sin ningún aviso.

## 3. Impacto en las pantallas siguientes

Recorrido (`App.tsx` L66-69): PlieguesPorPunta → `/resultado-pieza` (L296-313) → `/validacion-maquina` → `/sugeridor-vueltas` → `/remates-desiguales`.

- **ResultadoPiezaPage.tsx**: recibe `desarrolloPuntaA/B/Total` (L52-54) y `calc` de cada pliegue. Muestra los totales (L108-110) y el `calc.desarrollo` de cada pliegue (L143), así que repite la contradicción en esta pantalla (CONFIRMADO). Calcula `remateDesigual = |desA−desB| > 0.5` (L269) y lo pasa adelante. El dibujo usa solo las longitudes (L64), no le afecta.
- **validarPieza.ts** (vía ValidacionMaquinaPage L35-37): L118 usa `remateDesigual` si viene, si no la diferencia; L123-125 muestra A/B en el aviso; L154 muestra D total. Como la diferencia A−B cambia en 2·(ΣBA_A − ΣBA_B), el aviso de remate desigual podría salir o no según el criterio cuando las puntas tienen distinto número de pliegues o ángulos. Es plausible, pero NO DEMOSTRADO con un caso concreto en la app. El signo negativo solo afectaría al texto.
- **SugeridorVueltasPage.tsx** (L28-33) → `sugerirVueltas.ts` L51-55: `desigual` y `empezarPor = A >= B ? "A" : "B"`. El orden de los pliegues (L64-77) depende de `empezarPor`. Que cambie la punta por la que se empieza es plausible, pero NO DEMOSTRADO.
- **RematesDesigualesPage.tsx** L61-67: toma `desarrolloPuntaA/B` como **ala** inicial (`inferAlaA/B`). Mezcla dos conceptos distintos (desarrollo frente a cota de ala): CONFIRMADO por el código. `num()` (L35-38) deja pasar números negativos, así que un desarrollo negativo se cargaría como ala negativa en el formulario (CONFIRMADO por el código; no probado en el navegador).

## 4. Pruebas de caracterización: qué sirve de verdad

Una prueba que copia la fórmula en una función auxiliar del test **no sirve**: solo repite la fórmula y no prueba lo que hace la página. Las pruebas útiles deben mostrar `PlieguesPorPuntaPage` dentro de un router de prueba, escribir en los campos reales, leer lo que muestra la pantalla y capturar los datos que se pasan a `/resultado-pieza` mediante una ruta de prueba.

Conjunto mínimo recomendado, que deja fijado el comportamiento actual sin corregirlo:
1. Cero pliegues: Punta A, Punta B y Total = 0.00 (lo permite la interfaz).
2. Un pliegue A, L=50, 90°: el pliegue muestra 52.36 y la Punta A muestra 47.64. Esta prueba documenta la contradicción (lo permite la interfaz).
3. Pliegue añadido sin editar (L=0): la Punta muestra −2.36 (lo permite la interfaz).
4. Ángulo 0°: el pliegue y la punta muestran lo mismo (lo permite la interfaz).
5. Dos pliegues en A y ninguno en B: Total = Punta A, y la diferencia frente a sumar es 2·ΣBA (lo permite la interfaz).
6. Los datos que se pasan al navegar llevan los mismos `desarrolloPuntaA/B/Total` que se ven en pantalla.
7. Defensivo: longitud −10 y ángulo 200 escritos a mano se aceptan y se calculan sin aviso. Esto deja constancia de que no hay comprobación; no establece ningún rango.

Opcional y fuera del mínimo: probar `validarPieza`/`sugerirVueltas` con valores A/B calculados con los dos criterios, para demostrar o descartar los efectos marcados como NO DEMOSTRADO.

## 5. Resumen

- CONFIRMADO: suma en un sitio y resta en otro en la misma página (L44-49 frente a L95-105); se puede mostrar un desarrollo negativo; ResultadoPieza repite la contradicción; RematesDesiguales toma un desarrollo como ala; no hay comprobación de valores negativos ni fuera de rango.
- CONTRADICCIÓN: K y R fijos y lista de materiales distinta de la Fase 1 (L33-40, L57-59).
- NO DEMOSTRADO: que cambie el aviso de remate desigual en validarPieza o la punta inicial en sugerirVueltas; cuál de los dos criterios es el correcto para el taller (hay que decidirlo antes de corregir).
- Archivos modificados: ninguno (solo este informe).

## Siguiente paso, si se aprueba

Crear únicamente `src/pages/__tests__/PlieguesPorPuntaPage.test.tsx` con las pruebas 1 a 7, sin tocar nada del código de producción, y ejecutar todas las pruebas y la comprobación de tipos.
