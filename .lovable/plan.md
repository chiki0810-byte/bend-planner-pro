# Auditoría (solo lectura): qué es `p.longitud` en Pliegues por Punta

No se ha modificado ningún archivo de código ni el roadmap. Solo se ha escrito este informe.

## Veredicto

**Con lo que hay en el proyecto no se puede saber qué medida física representa `p.longitud`.** Nada en el código, la pantalla, la documentación, el historial de cambios ni las especificaciones del chat dice si es una cota interior, una cota exterior, un tramo entre tangencias o la longitud nominal del ala. Hasta ahora siempre se ha tratado como un número que se combina con BA, con signos que han ido cambiando.

## Evidencia

| # | Fuente | Qué dice | Clasificación |
|---|---|---|---|
| 1 | `PlieguesPorPuntaPage.tsx` L19-24 (tipo `Pliegue`) | `longitud: number`, sin comentario ni unidad de referencia | CONFIRMADO: no define la referencia |
| 2 | Misma página, L119-126 | Etiqueta "Longitud (mm)", sin placeholder ni ayuda, `min=0` | CONFIRMADO: no define la referencia |
| 3 | Misma página, L64/L67 | Valor inicial al añadir un pliegue: 0 | CONFIRMADO |
| 4 | Misma página, L197-243 | El radio solo aparece como "Radio Interior (mm)" global. No hay selector interior/exterior | CONFIRMADO |
| 5 | Búsqueda de `dimensionReference` | Solo existe en `BendItem.tsx` L21/L116-119 (otra pantalla); esta página no lo usa | CONFIRMADO |
| 6 | Cada fila de la lista es a la vez una longitud y un ángulo | N filas = N tramos y N pliegues; el último tramo recto no tiene sitio propio | CONFIRMADO por la forma de los datos |
| 7 | Chat #67 (11-may): especificación que creó la pantalla | "Campo numérico Longitud (mm)" dentro de cada pliegue, sin definirla | CONFIRMADO: el origen no la define |
| 8 | Chat #69 (12-may): especificación de los cálculos | `Comp = Longitud − BA`; desarrollo por punta = ΣL − ΣBA | CONFIRMADO: el diseño original restaba en los dos sitios (coherente) |
| 9 | Adjunto "ETAPA 3H" (chat #249-250, 2-sep) | Cambia solo el cálculo por pliegue a `L + BA`. Su prueba de comprobación espera **Punta A ≈ 101.39 con L=100 a 60°**, es decir que la punta también sume BA | CONFIRMADO |
| 10 | Código actual, L95-105 | La punta sigue con ΣL − ΣBA. Con el caso de 3H daría 98.61, no 101.39 | **CONTRADICCIÓN**: la intención de 3H no se aplicó a la punta, y el informe de entonces (chat #250) no comprobó ese caso en la pantalla |
| 11 | Uso posterior: `validarPieza.ts` L60-74 y L96-101, `sugerirVueltas.ts` L39 y L83-84 | Comparan `longitud` con mínimos de **ala** (<10, <15, <20, ≥50 mm) y la llaman "ala" en los mensajes | PROBABLE que se haya pensado como longitud del ala (la reutilizan así), pero no dice si la cota es interior o exterior |
| 12 | `ResultadoPiezaPage.tsx` L64-71 y L139 | Usa la longitud solo para el dibujo y para el texto "a {L} mm" | No aporta nada sobre la referencia |
| 13 | `RematesDesigualesPage.tsx` L61-67 | Usa la primera o última `longitud` como "ala" solo si no llega el desarrollo de la punta | PROBABLE, igual que la fila 11 |
| 14 | Historial de cambios (`git log`) | 8 commits llamados "Changes", sin mensajes descriptivos; la primera versión ya tenía "Longitud (mm)" sin explicación | NO DEMOSTRADO |
| 15 | README, PACKAGING.md, funciones de IA | No mencionan la referencia de `longitud` | NO DEMOSTRADO |
| 16 | Auditoría anterior (chat #258, 4-sep) | Llegó a la misma conclusión: NO DEMOSTRADO; incompatible con una cota exterior porque no usa OSSB ni BD | Lo confirma de forma independiente |

## Qué indica cada signo (es lo que implica la fórmula, no prueba la intención)

- **L + BA** (3H, cálculo por pliegue): solo es correcto si L son los tramos rectos **entre tangencias**, sin contar la zona curva.
- **L − BA** (especificación original y desarrollo actual por punta): no corresponde a ninguna convención estándar. Si L fuera una cota exterior, lo correcto sería restar BD = 2·OSSB − BA, no BA.
- Ninguno de los dos es correcto para una **cota interior** a la intersección teórica; en ese caso habría que restar 2·(OSSB_int) − BA.

## Dato mínimo para decidir

Una pieza real ya medida, con un solo pliegue a 90°, con estos datos:
1. Material, espesor, radio interior real del útil (y K, si se conoce).
2. Las dos alas **como se acotan en el plano del taller**, indicando dónde termina cada cota: cara interior, cara exterior o tangencia.
3. El **desarrollo real** de esa pieza: lo que la Stefa programa o lo que se mide en chapa plana antes de plegar.

Con eso, solo una convención (L+BA entre tangencias, L−BD exterior o interior con OSSB) cuadra con el desarrollo medido. Para mayor seguridad, conviene repetirlo con una segunda pieza de otro ángulo (por ejemplo 135°).

## Resumen

- CONFIRMADO: ningún dato del proyecto define la referencia física; el diseño original restaba en los dos sitios; 3H cambió solo el cálculo por pliegue.
- CONTRADICCIÓN: 3H esperaba que la punta sumara BA (101.39) y el código de la punta sigue restando.
- PROBABLE: que se pensara como "longitud de ala" (por cómo la usan las comprobaciones posteriores), sin saber si la cota es interior o exterior.
- NO DEMOSTRADO: que sea una cota interior, una cota exterior o un tramo entre tangencias.
- Archivos modificados: ninguno.
