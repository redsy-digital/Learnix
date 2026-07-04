/**
 * AIProvider.ts — Interface base para todos os fornecedores de IA
 *
 * REGRA ABSOLUTA: nenhum outro ficheiro do projecto (services, hooks,
 * componentes) poderá importar GeminiProvider ou qualquer fornecedor
 * concreto directamente. Toda a comunicação com IA passa por esta interface.
 *
 * Isto garante:
 *  - Substituição de fornecedor sem alterar nada no resto da aplicação
 *  - Testabilidade total via MockProvider
 *  - Suporte a múltiplos modelos/fornecedores em simultâneo no futuro
 */

import type { AIProviderName } from '../types/ai';

/**
 * Opções de configuração de uma chamada ao fornecedor.
 * Desacopladas de qualquer API específica.
 */
export interface AICallOptions {
  /** Temperatura (criatividade): 0.0 = determinístico, 1.0 = criativo */
  temperature?: number;
  /** Número máximo de tokens na resposta */
  maxTokens?:   number;
  /** Timeout em milissegundos */
  timeoutMs?:   number;
}

/**
 * Resposta crua devolvida pelo fornecedor (antes de parsing).
 * Sempre texto — o parsing é feito nas camadas superiores.
 */
export interface RawProviderResponse {
  text:       string;
  model:      string;
  latencyMs:  number;
  tokensUsed?: number;
}

/**
 * Interface base que todos os fornecedores de IA devem implementar.
 * O AIService só conhece esta interface — nunca os fornecedores concretos.
 */
export interface AIProvider {
  /** Nome único do fornecedor */
  readonly name: AIProviderName;

  /**
   * Verifica se o fornecedor está disponível e configurado.
   * No GeminiProvider, verifica se a Edge Function está acessível.
   * No MockProvider, devolve sempre true.
   */
  isAvailable(): Promise<boolean>;

  /**
   * Envia um prompt e devolve a resposta crua.
   * O fornecedor NÃO sabe nada sobre o conteúdo do prompt
   * (não constrói prompts, não valida respostas, não faz parsing).
   *
   * @param systemPrompt - Instruções de sistema (contexto, formato, regras)
   * @param userPrompt   - Prompt específico da operação
   * @param options      - Opções de configuração da chamada
   */
  complete(
    systemPrompt: string,
    userPrompt:   string,
    options?:     AICallOptions
  ): Promise<RawProviderResponse>;
}
