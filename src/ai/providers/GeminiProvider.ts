/**
 * GeminiProvider.ts — Fornecedor Google Gemini via Supabase Edge Function
 *
 * ARQUITECTURA DE SEGURANÇA:
 * A chave GEMINI_API_KEY NUNCA está no frontend.
 * Esta classe comunica com uma Supabase Edge Function que faz a chamada real.
 * A Edge Function tem acesso ao secret GEMINI_API_KEY via Supabase Secrets.
 *
 * Fluxo:
 *   Frontend → GeminiProvider → Supabase Edge Function → Gemini API
 *
 * ESTADO ACTUAL: Edge Function ainda não implementada (etapa futura).
 * Ao chamar complete(), lança AIProviderNotReadyError controlado.
 */

import type { AIProvider, AICallOptions, RawProviderResponse } from './AIProvider';
import type { AIProviderName } from '../types/ai';

// ─── Errors controlados ───────────────────────────────────────────────────────

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

// ─── Configuração ─────────────────────────────────────────────────────────────

interface GeminiProviderConfig {
  /**
   * URL da Supabase Edge Function que faz a chamada ao Gemini.
   * Formato: https://<project-ref>.supabase.co/functions/v1/ai-complete
   * Quando não definido, o provider fica no modo "not-ready".
   */
  edgeFunctionUrl?: string;

  /**
   * Modelo Gemini a utilizar (passado à Edge Function).
   * Default: 'gemini-1.5-flash' (rápido e económico para exercícios e resumos)
   */
  model?: string;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class GeminiProvider implements AIProvider {
  readonly name: AIProviderName = 'gemini';

  private readonly edgeFunctionUrl: string | null;
  private readonly model: string;

  constructor(config: GeminiProviderConfig = {}) {
    this.edgeFunctionUrl = config.edgeFunctionUrl ?? null;
    this.model           = config.model ?? 'gemini-1.5-flash';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.edgeFunctionUrl) return false;
    try {
      // Health-check leve à Edge Function
      const res = await fetch(`${this.edgeFunctionUrl}/health`, {
        method:  'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async complete(
    systemPrompt: string,
    userPrompt:   string,
    options:      AICallOptions = {}
  ): Promise<RawProviderResponse> {
    // Edge Function ainda não implementada
    if (!this.edgeFunctionUrl) {
      throw new AIProviderNotReadyError(
        this.name,
        'A Supabase Edge Function ainda não foi configurada. ' +
        'Esta integração será implementada na próxima etapa de desenvolvimento.'
      );
    }

    const startTime = Date.now();
    const timeoutMs = options.timeoutMs ?? 30_000;

    // AbortController para timeout
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), timeoutMs);

    try {
      /**
       * Payload enviado à Edge Function.
       * A Edge Function é responsável por:
       *  1. Ler GEMINI_API_KEY dos Supabase Secrets
       *  2. Construir o request para a Gemini API
       *  3. Devolver a resposta normalizada
       */
      const payload = {
        systemPrompt,
        userPrompt,
        model:       this.model,
        temperature: options.temperature ?? 0.7,
        maxTokens:   options.maxTokens   ?? 2048,
      };

      const response = await fetch(this.edgeFunctionUrl, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          // A autenticação com o Supabase Auth é feita via cookie/session
          // A Edge Function valida o JWT automaticamente
        },
        body:   JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const detail = await response.text().catch(() => undefined);
        throw new AIProviderNetworkError(this.name, response.status, detail);
      }

      const json = await response.json();

      return {
        text:        json.text        ?? '',
        model:       json.model       ?? this.model,
        latencyMs:   Date.now() - startTime,
        tokensUsed:  json.tokensUsed,
      };
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error && err.name === 'AbortError') {
        throw new AIProviderTimeoutError(this.name, timeoutMs);
      }
      if (
        err instanceof AIProviderNetworkError ||
        err instanceof AIProviderNotReadyError
      ) {
        throw err;
      }
      throw new Error(`[${this.name}] Erro inesperado: ${(err as Error).message}`);
    }
  }
}
