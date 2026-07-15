import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RequestPayload {
  systemPrompt: string;
  userPrompt:   string;
  model?:       string;
  temperature?: number;
  maxTokens?:   number;
}

const GEMINI_API_BASE  = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL    = 'gemini-2.5-flash';
const DEFAULT_TEMP     = 0.7;
const DEFAULT_TOKENS   = 2048;
const TIMEOUT_MS       = 25_000;

// Domínio real de produção confirmado: learnix-redsy.vercel.app
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://learnix-redsy.vercel.app',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  // Se o origin do pedido estiver na lista, ecoa-o exactamente.
  // Caso contrário, não usa wildcard nem fallback fixo — apenas omite
  // Access-Control-Allow-Origin, o que faz o browser bloquear
  // corretamente (em vez de mascarar como erro de rede).
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : null;
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age':       '86400',
  };
  if (allowedOrigin) headers['Access-Control-Allow-Origin'] = allowedOrigin;
  return headers;
}

function errorResponse(message: string, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function validatePayload(body: unknown): body is RequestPayload {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.systemPrompt === 'string' && b.systemPrompt.trim().length > 0 &&
    typeof b.userPrompt   === 'string' && b.userPrompt.trim().length > 0
  );
}

async function callGeminiAPI(
  apiKey: string, payload: RequestPayload, signal: AbortSignal
): Promise<{ text: string; model: string; tokensUsed: number }> {
  const model       = payload.model       ?? DEFAULT_MODEL;
  const temperature = payload.temperature ?? DEFAULT_TEMP;
  const maxTokens   = payload.maxTokens   ?? DEFAULT_TOKENS;
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  const geminiPayload = {
    system_instruction: { parts: [{ text: payload.systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: payload.userPrompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geminiPayload),
    signal,
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 400) throw new Error('GEMINI_BAD_REQUEST');
    if (status === 401) throw new Error('GEMINI_AUTH_ERROR');
    if (status === 403) throw new Error('GEMINI_FORBIDDEN');
    if (status === 429) throw new Error('GEMINI_QUOTA_EXCEEDED');
    if (status >= 500)  throw new Error('GEMINI_SERVER_ERROR');
    throw new Error(`GEMINI_HTTP_${status}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error('GEMINI_NO_CANDIDATE');
  const text = candidate.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('GEMINI_EMPTY_RESPONSE');

  return {
    text,
    model:      data.modelVersion ?? model,
    tokensUsed: data.usageMetadata?.totalTokenCount ?? 0,
  };
}

Deno.serve(async (req: Request) => {
  const origin      = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Método não permitido.', 405, corsHeaders);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return errorResponse('Autenticação obrigatória.', 401, corsHeaders);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Sessão inválida ou expirada.', 401, corsHeaders);

    console.log(`[ai-complete] user=${user.id} origin=${origin}`);

    let body: unknown;
    try { body = await req.json(); }
    catch { return errorResponse('Payload inválido.', 400, corsHeaders); }

    if (!validatePayload(body)) return errorResponse('systemPrompt e userPrompt são obrigatórios.', 400, corsHeaders);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('[ai-complete] GEMINI_API_KEY não configurada');
      return errorResponse('Serviço de IA indisponível.', 503, corsHeaders);
    }

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let result: { text: string; model: string; tokensUsed: number };
    try {
      result = await callGeminiAPI(apiKey, body, controller.signal);
    } catch (err) {
      clearTimeout(timeoutId);
      const msg = (err as Error).message;
      console.error(`[ai-complete] Gemini erro: ${msg}`);
      if (msg === 'GEMINI_QUOTA_EXCEEDED')  return errorResponse('Limite de IA atingido.', 429, corsHeaders);
      if (msg === 'GEMINI_AUTH_ERROR' || msg === 'GEMINI_FORBIDDEN') return errorResponse('Serviço de IA indisponível.', 503, corsHeaders);
      if (err instanceof Error && err.name === 'AbortError') return errorResponse('Timeout da IA.', 504, corsHeaders);
      if (msg.startsWith('GEMINI_')) return errorResponse('Erro no serviço de IA.', 502, corsHeaders);
      return errorResponse('Erro inesperado.', 500, corsHeaders);
    }

    clearTimeout(timeoutId);
    console.log(`[ai-complete] ok — ${result.tokensUsed} tokens, modelo: ${result.model}`);

    return new Response(
      JSON.stringify({ text: result.text, model: result.model, tokensUsed: result.tokensUsed }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (err) {
    console.error('[ai-complete] erro inesperado:', (err as Error).message);
    return errorResponse('Erro interno.', 500, corsHeaders);
  }
});
