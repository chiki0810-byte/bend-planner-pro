import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const body = await req.json();
    const { pliegues, material, espesor, desarrolloTotal, desarrolloPuntaA, desarrolloPuntaB } = body || {};

    const userPrompt = `Analiza esta pieza de chapa.
Material: ${material}
Espesor: ${espesor} mm
Desarrollo total: ${desarrolloTotal} mm
Punta A: ${desarrolloPuntaA} mm
Punta B: ${desarrolloPuntaB} mm
Pliegues (JSON):
${JSON.stringify(pliegues, null, 2)}

Devuelve avisos de alas cortas, ángulos imposibles, choques evidentes, orden recomendado de pliegues y observaciones industriales.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content:
              'Eres un experto en plegado de chapa industrial. Analizas piezas y devuelves SIEMPRE un JSON válido (sin texto fuera del JSON) con la forma: {"avisosAlasCortas":[],"angulosImposibles":[],"choquesEvidentes":[],"ordenRecomendado":[],"observaciones":[]}. Cada elemento de las listas es un string corto en español.',
          },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit. Intenta de nuevo en unos segundos.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: 'Sin créditos en Lovable AI. Añade saldo.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error('AI gateway error', response.status, t);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { observaciones: [text] };
    }

    return new Response(JSON.stringify({ ok: true, ai: parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('validar-pieza-ai error', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
