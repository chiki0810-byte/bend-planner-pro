
## Objetivo
Añadir una nueva pestaña **"Asistente IA"** que, **solo si hay internet**, consulta a un modelo IA con los datos del pliegue (material, espesor, longitud, ángulo, máquina) y devuelve recomendaciones técnicas estructuradas. En modo offline (uso típico en taller con .apk/.exe), la pestaña queda visible pero deshabilitada con un aviso claro.

## Arquitectura

### 1. Backend — Edge function `ai-plegado-asistente`
Archivo: `supabase/functions/ai-plegado-asistente/index.ts`

- Llama al **Lovable AI Gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`) con `google/gemini-3-flash-preview`.
- Usa **tool calling** para garantizar JSON estructurado (más fiable que pedir "responde solo JSON"):
  - `angulo_compensado`, `fuerza_necesaria`, `pasos_operacion`, `advertencias`, `notas_tecnicas`.
- System prompt en español, perfil "experto en plegado de chapa, taller real".
- Maneja errores **429** (rate limit) y **402** (créditos) devolviéndolos al cliente para mostrar toast.
- CORS configurado.
- Requiere `LOVABLE_API_KEY` (auto-provisionado por Lovable Cloud).

### 2. Frontend — Componente `AsistenteIA.tsx`
Archivo: `src/components/AsistenteIA.tsx`

Formulario con 5 campos:
- Material (select reutilizando lista del proyecto)
- Espesor (select 0.5–1.5 mm)
- Longitud (mm)
- Ángulo (°)
- Máquina (select: Stefa 8m / Jordi PH6100-180 / Prensa 6m)

Botón **"Consultar IA"**:
- Detecta `navigator.onLine`. Si offline → toast "Esta función requiere internet. No disponible en modo taller offline." y no hace la petición.
- Si online → invoca la edge function vía `supabase.functions.invoke()`.
- Muestra spinner durante la consulta.
- Renderiza resultado en 5 tarjetas con iconos (ángulo compensado, fuerza, pasos, advertencias en amber, notas técnicas).
- Botón "Copiar resultado" al portapapeles.

Aviso permanente arriba: badge **"Requiere conexión a internet"** con explicación corta.

### 3. Integración en navegación
Archivo: `src/pages/Index.tsx` (o el router/tabs principal)

- Añadir nueva pestaña/sección **"Asistente IA"** con icono `Sparkles`.
- Mantener intacto todo lo demás (Pieza/Resultados, Historial/Plantillas, Materiales, Remates).

### 4. Cloud
- Si Lovable Cloud no está activado, activarlo (necesario para edge functions y `LOVABLE_API_KEY`).

## Detalle técnico del payload IA

```text
tools: [{
  type: "function",
  function: {
    name: "recomendacion_plegado",
    parameters: {
      type: "object",
      properties: {
        angulo_compensado: { type: "string" },
        fuerza_necesaria:  { type: "string" },
        pasos_operacion:   { type: "string" },
        advertencias:      { type: "string" },
        notas_tecnicas:    { type: "string" }
      },
      required: [...todos]
    }
  }
}]
tool_choice: { type: "function", function: { name: "recomendacion_plegado" } }
```

## Lo que NO se toca
- Cálculos BA/OSSB/BD existentes.
- Módulo Remates (modo profesional, PDF, Excel).
- Persistencia local SQLite/Dexie.
- Funcionamiento offline del resto de la app.

## Notas importantes
- En `.apk`/`.exe` empaquetado: la pestaña existe pero **solo funciona con internet**. Esto está alineado con tu elección de "modo opcional online".
- No se usa Groq/`llama3-8b-8192` del JSON original (requeriría `GROQ_API_KEY` extra y ofrece peor calidad que Gemini para esto). El comportamiento del prompt es equivalente.
