import { corsHeaders } from "@supabase/supabase-js/cors";

interface AsistenteInput {
  material?: string;
  espesor?: string | number;
  longitud?: string | number;
  angulo?: string | number;
  maquina?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY no configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as AsistenteInput;
    const { material, espesor, longitud, angulo, maquina } = body;

    if (!material || !espesor || !longitud || !angulo || !maquina) {
      return new Response(JSON.stringify({ error: "Faltan campos: material, espesor, longitud, angulo, maquina" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Eres un experto en plegado de chapa con 30 años de experiencia en taller real.
Conoces plegadoras tipo Stefa 8m, Jordi PH6100-180 (180 toneladas) y prensas de 6m.
Respondes SIEMPRE en español, técnico, breve y orientado al operario.
Usas la herramienta 'recomendacion_plegado' para devolver la respuesta estructurada.
- angulo_compensado: ángulo a programar para compensar el retorno elástico (springback) según material/espesor.
- fuerza_necesaria: tonelaje estimado por metro (t/m) y total para la longitud dada.
- pasos_operacion: lista breve de pasos prácticos (matriz, punzón, posición de tope, secuencia).
- advertencias: riesgos, fisuras, marcas, radio mínimo, sentido de fibra, etc.
- notas_tecnicas: K-factor, radio interior recomendado, tolerancias.`;

    const userPrompt = `Material: ${material}
Espesor: ${espesor} mm
Longitud: ${longitud} mm
Ángulo deseado: ${angulo}°
Máquina: ${maquina}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recomendacion_plegado",
              description: "Devuelve recomendaciones técnicas estructuradas para el plegado.",
              parameters: {
                type: "object",
                properties: {
                  angulo_compensado: { type: "string", description: "Ángulo a programar compensando springback (con unidades)." },
                  fuerza_necesaria: { type: "string", description: "Tonelaje estimado, t/m y total." },
                  pasos_operacion: { type: "string", description: "Pasos breves (matriz, punzón, tope, secuencia)." },
                  advertencias: { type: "string", description: "Riesgos / precauciones / radio mínimo / fibra." },
                  notas_tecnicas: { type: "string", description: "K-factor, radio interior, tolerancias." },
                },
                required: ["angulo_compensado", "fuerza_necesaria", "pasos_operacion", "advertencias", "notas_tecnicas"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "recomendacion_plegado" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Límite de peticiones excedido. Intenta de nuevo en unos minutos." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "Sin créditos de IA disponibles. Añade fondos en tu workspace." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "Error en el gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;

    if (!argsStr) {
      console.error("Sin tool_call en respuesta:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "La IA no devolvió la respuesta esperada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(argsStr);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-plegado-asistente error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
