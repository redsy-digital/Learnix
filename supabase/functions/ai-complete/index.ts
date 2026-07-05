/**
 * ai-complete — Supabase Edge Function
 *
 * Ponto único de comunicação entre o Learnix e a API do Google Gemini.
 *
 * SEGURANÇA:
 *  - A GEMINI_API_KEY é lida dos Supabase Secrets (nunca exposta no frontend)
 *  - Todos os pedidos são autenticados via JWT do Supabase Auth
 *  - Respostas de erro nunca expõem detalhes internos da API
 *  - CORS configurado para aceitar apenas origens conhecidas
 *
 * FLUXO:
 *   Frontend (GeminiProvider)
 *     → POST /functions/v1/ai-complete  [com Authorization: Bearer <jwt>]
 *       → validar JWT (Supabase valida automaticamente)
 *       → validar payload
 *       → chamar Gemini API com GEMINI_API_KEY do Secrets
 *       → devolver { text, model, tokensUsed }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface RequestPayload {
  systemPrompt: string;
  userPrompt:   string;
  model?:       string;
  temperature?: number;
  maxTokens?:   number;
}

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  parts: GeminiPart[];
  role:  string;
}

interface GeminiCandidate {
  content: GeminiContent;
  finishReason: string;
}

interface GeminiUsageMetadata {
  promptTokenCount:     number;
  candidatesTokenCount: number;
  totalTokenCount:      number;
}

interface GeminiResponse {
  candidates:    GeminiCandidate[];
  usageMetadata: GeminiUsageMetadata;
  modelVersion:  string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL   = 'gemini-1.5-flash';
const DEFAULT_TEMP    = 0.7;
const DEFAULT_TOKENS  = 2048;
const TIMEOUT_MS      = 25_000; // 25s (Edge Functions têm limite de 30s)

// Origens permitidas para CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://learnix.vercel.app',
  // Adicionar o domínio de produção aqui quando disponível
];

// ─── CORS ─────────────────────────────────────────────────────────────────────

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0]; // fallback para localhost em dev

  return {
    'Access-Control-Allow-Origin':  allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age':       '86400',
  };
}

// ─── Respostas de erro normalizadas ──────────────────────────────────────────

function errorResponse(
  message: string,
  status:  number,
  corsHeaders: Record<string, string>
): Response {
  // NUNCA incluir detalhes internos da API nas respostas de erro
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    }
  );
}

// ─── Validação do payload ─────────────────────────────────────────────────────

function validatePayload(body: unknown): body is RequestPayload {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.systemPrompt === 'string' && b.systemPrompt.trim().length > 0 &&
    typeof b.userPrompt   === 'string' && b.userPrompt.trim().length > 0
  );
}

// ─── Chamada à Gemini API ─────────────────────────────────────────────────────

async function callGeminiAPI(
  apiKey:       string,
  payload:      RequestPayload,
  signal:       AbortSignal
): Promise<{ text: string; model: string; tokensUsed: number }> {
  const model       = payload.model       ?? DEFAULT_MODEL;
  const temperature = payload.temperature ?? DEFAULT_TEMP;
  const maxTokens   = payload.maxTokens   ?? DEFAULT_TOKENS;

  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  /**
   * Gemini API: usa o systemPrompt como instruction e o userPrompt como mensagem.
   * Formato: system_instruction + contents[{role: user, parts: [{text}]}]
   */
  const geminiPayload = {
    system_instruction: {
      parts: [{ text: payload.systemPrompt }],
    },
    contents: [
      {
        role:  'user',
        parts: [{ text: payload.userPrompt }],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      // Forçar output em JSON para facilitar parsing
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(geminiPayload),
    signal,
  });

  if (!response.ok) {
    const status = response.status;
    // Traduzir erros da Gemini API para mensagens seguras (sem expor detalhes)
    if (status === 400) throw new Error('GEMINI_BAD_REQUEST');
    if (status === 401) throw new Error('GEMINI_AUTH_ERROR');
    if (status === 403) throw new Error('GEMINI_FORBIDDEN');
    if (status === 429) throw new Error('GEMINI_QUOTA_EXCEEDED');
    if (status >= 500)  throw new Error('GEMINI_SERVER_ERROR');
    throw new Error(`GEMINI_HTTP_${status}`);
  }

  const data: GeminiResponse = await response.json();

  // Extrair texto da resposta
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

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const origin      = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Só aceitar POST
  if (req.method !== 'POST') {
    return errorResponse('Método não permitido.', 405, corsHeaders);
  }

  // ── 1. Autenticação via JWT do Supabase Auth ──────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('Autenticação obrigatória.', 401, corsHeaders);
  }

  try {
    // Validar o JWT usando o Supabase client (usa as variáveis de ambiente automáticas)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Sessão inválida ou expirada.', 401, corsHeaders);
    }

    console.log(`[ai-complete] Pedido de user: ${user.id}`);

    // ── 2. Validar payload ──────────────────────────────────────────────────
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Payload inválido — esperava JSON.', 400, corsHeaders);
    }

    if (!validatePayload(body)) {
      return errorResponse(
        'Payload inválido — systemPrompt e userPrompt são obrigatórios.',
        400,
        corsHeaders
      );
    }

    // ── 3. Obter API Key dos Secrets (NUNCA exposta ao frontend) ─────────────
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('[ai-complete] GEMINI_API_KEY não configurada nos Secrets');
      return errorResponse(
        'Serviço de IA temporariamente indisponível.',
        503,
        corsHeaders
      );
    }

    // ── 4. Chamar a Gemini API com timeout ───────────────────────────────────
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let result: { text: string; model: string; tokensUsed: number };

    try {
      result = await callGeminiAPI(apiKey, body, controller.signal);
    } catch (err) {
      clearTimeout(timeoutId);

      const msg = (err as Error).message;
      console.error(`[ai-complete] Erro Gemini: ${msg}`);

      // Traduzir erros internos para mensagens amigáveis
      if (msg === 'GEMINI_QUOTA_EXCEEDED') {
        return errorResponse('Limite de IA atingido. Tenta novamente em alguns minutos.', 429, corsHeaders);
      }
      if (msg === 'GEMINI_AUTH_ERROR' || msg === 'GEMINI_FORBIDDEN') {
        return errorResponse('Serviço de IA temporariamente indisponível.', 503, corsHeaders);
      }
      if (err instanceof Error && err.name === 'AbortError') {
        return errorResponse('A IA demorou demasiado a responder. Tenta novamente.', 504, corsHeaders);
      }
      if (msg.startsWith('GEMINI_')) {
        return errorResponse('Erro no serviço de IA. Tenta novamente.', 502, corsHeaders);
      }

      return errorResponse('Erro inesperado. Tenta novamente.', 500, corsHeaders);
    }

    clearTimeout(timeoutId);

    console.log(`[ai-complete] Sucesso — ${result.tokensUsed} tokens, modelo: ${result.model}`);

    // ── 5. Devolver resposta ao frontend ──────────────────────────────────────
    return new Response(
      JSON.stringify({
        text:       result.text,
        model:      result.model,
        tokensUsed: result.tokensUsed,
      }),
      {
        status:  200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (err) {
    console.error('[ai-complete] Erro não esperado:', (err as Error).message);
    return errorResponse('Erro interno do servidor.', 500, corsHeaders);
  }
});
