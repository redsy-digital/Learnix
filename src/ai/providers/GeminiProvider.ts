/**
 * GeminiProvider.ts — Fornecedor Google Gemini via Supabase Edge Function
 *
 * ARQUITECTURA DE SEGURANÇA:
 *  - A GEMINI_API_KEY NUNCA está no frontend
 *  - Toda a comunicação passa pela Edge Function ai-complete
 *  - O JWT do utilizador autenticado é enviado em cada pedido
 *  - A Edge Function valida o JWT antes de chamar a Gemini API
 *
 * Fluxo:
 *   GeminiProvider.complete()
 *     → GET supabase.auth.getSession()   (JWT do utilizador)
 *     → POST /functions/v1/ai-complete   (com Authorization: Bearer <jwt>)
 *       → Edge Function valida JWT
 *       → Edge Function obtém GEMINI_API_KEY dos Secrets
 *       → Edge Function chama Gemini API
 *       → Devolve { text, model, tokensUsed }
 *     → RawProviderResponse
 */

import type { AIProvider, AICallOptions, RawProviderResponse } from './AIProvider';
import type { AIProviderName } from '../types/ai';
import { supabase } from '../../lib/supabase';

// ─── Erros controlados ────────────────────────────────────────────────────────

export class AIProviderNotReadyError extends Error {
  constructor(provider: string, reason: string) {
    super(`[${provider}] Não está pronto: ${reason}`);
    this.name = 'AIProviderNotReadyError';
  }
}

export class AIProviderNetworkError extends Error {
  constructor(provider: string, status: number, detail?: string) {
    super(`[${provider}] Erro de rede: HTTP ${status}${detail ? ` — ${detail}` : ''}`);
    this.name = 'AIProviderNetworkError';
  }
}

export class AIProviderTimeoutError extends Error {
  constructor(provider: string, timeoutMs: number) {
    super(`[${provider}] Timeout após ${timeoutMs}ms`);
    this.name = 'AIProviderTimeoutError';
  }
}

export class AIProviderAuthError extends Error {
  constructor(provider: string) {
    super(`[${provider}] Sessão expirada ou inválida. Inicia sessão novamente.`);
    this.name = 'AIProviderAuthError';
  }
}

export class AIProviderQuotaError extends Error {
  constructor(provider: string) {
    super(`[${provider}] Limite de IA atingido. Tenta novamente em alguns minutos.`);
    this.name = 'AIProviderQuotaError';
  }
}

export class AIProviderCorsError extends Error {
  constructor(provider: string, origin: string) {
    super(
      `[${provider}] O domínio "${origin}" não está autorizado a comunicar com o serviço de IA. ` +
      `Contacta o suporte para adicionar este domínio à lista de origens permitidas.`
    );
    this.name = 'AIProviderCorsError';
  }
}

// ─── Configuração ─────────────────────────────────────────────────────────────

export interface GeminiProviderConfig {
  /**
   * URL da Supabase Edge Function.
   * Se não definido, usa a URL do projecto Learnix automaticamente.
   */
  edgeFunctionUrl?: string;

  /** Modelo Gemini a utilizar (default: gemini-1.5-flash) */
  model?: string;
}

// URL da Edge Function do projecto Learnix
const LEARNIX_EDGE_FUNCTION_URL =
  'https://suxrvjkffmthnniyzbeh.supabase.co/functions/v1/ai-complete';

// Modelo confirmado disponível via teste real à API Gemini (07/Jul/2026)
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

// ─── Provider ─────────────────────────────────────────────────────────────────

export class GeminiProvider implements AIProvider {
  readonly name: AIProviderName = 'gemini';

  private readonly edgeFunctionUrl: string;
  private readonly model: string;

  constructor(config: GeminiProviderConfig = {}) {
    this.edgeFunctionUrl = config.edgeFunctionUrl ?? LEARNIX_EDGE_FUNCTION_URL;
    this.model           = config.model           ?? DEFAULT_GEMINI_MODEL;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Verificar sessão do utilizador
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      // Testar conectividade com a Edge Function via OPTIONS (CORS preflight)
      const res = await fetch(this.edgeFunctionUrl, {
        method:  'OPTIONS',
        headers: { 'Origin': window.location.origin },
        signal:  AbortSignal.timeout(5000),
      });
      return res.status < 500;
    } catch {
      return false;
    }
  }

  async complete(
    systemPrompt: string,
    userPrompt:   string,
    options:      AICallOptions = {}
  ): Promise<RawProviderResponse> {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs ?? 30_000;

    // ── 1. Obter JWT do utilizador autenticado ────────────────────────────────
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new AIProviderAuthError(this.name);
    }

    // ── 2. Preparar payload para a Edge Function ──────────────────────────────
    const payload = {
      systemPrompt,
      userPrompt,
      model:       this.model,
      temperature: options.temperature ?? 0.7,
      maxTokens:   options.maxTokens   ?? 2048,
    };

    // ── 3. Chamar a Edge Function com timeout ─────────────────────────────────
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(this.edgeFunctionUrl, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          // JWT do utilizador — a Edge Function valida este token
          // A GEMINI_API_KEY nunca passa pelo frontend
          'Authorization': `Bearer ${session.access_token}`,
        },
        body:   JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // ── 4. Tratar respostas de erro da Edge Function ──────────────────────
      if (!response.ok) {
        let errorMsg: string | undefined;
        try {
          const errorJson = await response.json();
          errorMsg = errorJson?.error;
        } catch {
          errorMsg = undefined;
        }

        const status = response.status;

        if (status === 401 || status === 403) {
          throw new AIProviderAuthError(this.name);
        }
        if (status === 429) {
          throw new AIProviderQuotaError(this.name);
        }
        if (status === 504) {
          throw new AIProviderTimeoutError(this.name, timeoutMs);
        }
        throw new AIProviderNetworkError(this.name, status, errorMsg);
      }

      // ── 5. Extrair e devolver resposta ────────────────────────────────────
      const json = await response.json();

      if (!json.text || typeof json.text !== 'string') {
        throw new Error(`[${this.name}] Resposta da Edge Function sem campo 'text'`);
      }

      return {
        text:       json.text,
        model:      json.model      ?? this.model,
        latencyMs:  Date.now() - startTime,
        tokensUsed: json.tokensUsed ?? 0,
      };

    } catch (err) {
      clearTimeout(timeoutId);

      // Re-lançar erros já controlados
      if (
        err instanceof AIProviderAuthError    ||
        err instanceof AIProviderQuotaError   ||
        err instanceof AIProviderNetworkError ||
        err instanceof AIProviderNotReadyError ||
        err instanceof AIProviderCorsError
      ) {
        throw err;
      }

      // Timeout via AbortController
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AIProviderTimeoutError(this.name, timeoutMs);
      }

      // TypeError "Failed to fetch" tem MÚLTIPLAS causas possíveis:
      //  - CORS bloqueado pelo browser (origem não autorizada na Edge Function)
      //  - Edge Function em baixo ou URL incorrecta
      //  - falta de ligação à internet
      // NUNCA assumir "sem internet" sem verificar navigator.onLine primeiro —
      // essa suposição estava a mascarar erros de CORS como problema de rede.
      if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          throw new AIProviderNetworkError(this.name, 0, 'Sem ligação à internet');
        }
        // Há ligação à internet mas o fetch falhou de qualquer forma —
        // o cenário mais provável é CORS (origem não autorizada) ou a
        // Edge Function estar inacessível. Reportar isso, não "sem internet".
        throw new AIProviderCorsError(this.name, window.location.origin);
      }

      throw new Error(`[${this.name}] Erro inesperado: ${(err as Error).message}`);
    }
  }
}
