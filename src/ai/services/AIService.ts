/**
 * AIService.ts — Camada única de acesso à IA para todo o Learnix
 *
 * REGRA ABSOLUTA: nenhum componente React, hook ou service do Learnix
 * poderá importar GeminiProvider, MockProvider ou qualquer prompt/parser
 * directamente. Toda a comunicação com IA passa por esta classe.
 *
 * Responsabilidades:
 *  - Seleccionar o provider activo (Mock em dev, Gemini em prod)
 *  - Construir prompts via prompt builders
 *  - Enviar ao provider e receber resposta crua
 *  - Fazer parse e validar via parsers/validators
 *  - Empacotar no envelope AIResponse<T> uniforme
 *  - Nunca deixar erros não controlados chegar ao frontend
 *
 * Fluxo de dados:
 *   AIService.generateExercises(params)
 *     → buildGenerateExercisesPrompt(params)  [prompt builder]
 *     → provider.complete(system, user)        [GeminiProvider ou MockProvider]
 *     → parseExercise(rawText)                 [parser + validator]
 *     → AIResponse<Exercise>                   [envelope uniforme]
 */

import type { AIProvider } from '../providers/AIProvider';
import type {
  AIResponse, AIProviderName,
  ContentAnalysis, Exercise, Summary,
  FlashcardDeck, MockExam, AnswerExplanation,
  GenerateExercisesParams, GenerateSummaryParams,
  GenerateFlashcardsParams, GenerateMockExamParams,
  AnalyzeContentParams, ExplainAnswerParams,
} from '../types/ai';

// Prompt builders
import { buildAnalyzeContentPrompt }    from '../prompts/analyzeContent';
import { buildGenerateExercisesPrompt } from '../prompts/generateExercises';
import { buildGenerateSummaryPrompt }   from '../prompts/generateSummary';
import { buildGenerateFlashcardsPrompt } from '../prompts/generateFlashcards';
import { buildGenerateMockExamPrompt }  from '../prompts/generateMockExam';
import { buildExplainAnswerPrompt }     from '../prompts/explainAnswer';

// Parsers
import {
  parseContentAnalysis,
  parseExercise,
  parseSummary,
  parseFlashcardDeck,
  parseMockExam,
  parseAnswerExplanation,
} from '../parsers';

// ─── Factory e configuração ───────────────────────────────────────────────────

/**
 * Cria o AIService com o provider especificado.
 * Em desenvolvimento: MockProvider (sem API, sem quota).
 * Em produção: GeminiProvider (via Edge Function).
 *
 * Uso no projecto:
 *   import { aiService } from '../ai/services/AIService';
 *   const result = await aiService.generateExercises(params);
 */
class AIServiceClass {
  private provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  /**
   * Permite trocar o provider em runtime.
   * Útil para:
   *  - Testes que precisam de MockProvider
   *  - Feature flags (fallback para Mock se Gemini falhar)
   *  - Futura adição de outros modelos (OpenAI, Claude, etc.)
   */
  setProvider(provider: AIProvider): void {
    this.provider = provider;
  }

  get providerName(): AIProviderName {
    return this.provider.name;
  }

  // ─── Método interno de execução ─────────────────────────────────────────────

  /**
   * Executa uma operação de IA com tratamento uniforme de erros.
   * Todas as operações públicas delegam aqui.
   */
  private async execute<T>(
    featureName: string,
    systemPrompt: string,
    userPrompt: string,
    parse: (rawText: string) => T,
  ): Promise<AIResponse<T>> {
    const startTime = Date.now();

    try {
      const raw = await this.provider.complete(systemPrompt, userPrompt, {
        temperature: 0.7,
        maxTokens:   2048,
        timeoutMs:   30_000,
      });

      const data = parse(raw.text);

      return {
        success:    true,
        data,
        provider:   this.provider.name,
        model:      raw.model,
        latencyMs:  raw.latencyMs,
        tokensUsed: raw.tokensUsed,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`[AIService] ${featureName} falhou:`, message);

      return {
        success:  false,
        error:    this.translateError(message),
        provider: this.provider.name,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // ─── Operações públicas ──────────────────────────────────────────────────────

  /**
   * Analisa um conteúdo académico e devolve uma análise estruturada.
   * Este é o ponto de entrada do fluxo principal:
   *   conteúdo → análise → [exercícios | resumo | flashcards | simulado]
   */
  async analyzeContent(
    params: AnalyzeContentParams
  ): Promise<AIResponse<ContentAnalysis>> {
    const { systemPrompt, userPrompt } = buildAnalyzeContentPrompt(params);
    return this.execute(
      'analyzeContent',
      systemPrompt,
      userPrompt,
      parseContentAnalysis,
    );
  }

  /**
   * Gera exercícios personalizados para um conteúdo.
   * Pode reutilizar uma ContentAnalysis prévia (params.analysis)
   * para evitar re-analisar o mesmo conteúdo.
   */
  async generateExercises(
    params: GenerateExercisesParams
  ): Promise<AIResponse<Exercise>> {
    const { systemPrompt, userPrompt } = buildGenerateExercisesPrompt(params);
    return this.execute(
      'generateExercises',
      systemPrompt,
      userPrompt,
      parseExercise,
    );
  }

  /**
   * Gera um resumo académico estruturado.
   * Pode reutilizar análise prévia para maior relevância.
   */
  async generateSummary(
    params: GenerateSummaryParams
  ): Promise<AIResponse<Summary>> {
    const { systemPrompt, userPrompt } = buildGenerateSummaryPrompt(params);
    return this.execute(
      'generateSummary',
      systemPrompt,
      userPrompt,
      parseSummary,
    );
  }

  /**
   * Gera um deck de flashcards para memorização espaçada.
   * Pode reutilizar análise prévia.
   */
  async generateFlashcards(
    params: GenerateFlashcardsParams
  ): Promise<AIResponse<FlashcardDeck>> {
    const { systemPrompt, userPrompt } = buildGenerateFlashcardsPrompt(params);
    return this.execute(
      'generateFlashcards',
      systemPrompt,
      userPrompt,
      parseFlashcardDeck,
    );
  }

  /**
   * Gera um simulado completo com múltiplas disciplinas.
   */
  async generateMockExam(
    params: GenerateMockExamParams
  ): Promise<AIResponse<MockExam>> {
    const { systemPrompt, userPrompt } = buildGenerateMockExamPrompt(params);
    return this.execute(
      'generateMockExam',
      systemPrompt,
      userPrompt,
      parseMockExam,
    );
  }

  /**
   * Explica pedagogicamente a resposta de um aluno a uma questão.
   */
  async explainAnswer(
    params: ExplainAnswerParams
  ): Promise<AIResponse<AnswerExplanation>> {
    const { systemPrompt, userPrompt } = buildExplainAnswerPrompt(params);
    return this.execute(
      'explainAnswer',
      systemPrompt,
      userPrompt,
      parseAnswerExplanation,
    );
  }

  /**
   * Fluxo completo: analisa o conteúdo e gera exercícios a partir da análise.
   * Demonstra a reutilização da análise como base para outras funcionalidades.
   */
  async analyzeAndGenerateExercises(
    params: Omit<GenerateExercisesParams, 'analysis'>
  ): Promise<{
    analysis:  AIResponse<ContentAnalysis>;
    exercises: AIResponse<Exercise>;
  }> {
    // 1. Analisar o conteúdo
    const analysis = await this.analyzeContent({
      content: params.content,
      context: params.context,
    });

    // 2. Gerar exercícios com base na análise (se bem-sucedida)
    const exercises = await this.generateExercises({
      ...params,
      analysis: analysis.success ? analysis.data : undefined,
    });

    return { analysis, exercises };
  }

  // ─── Verificação de disponibilidade ─────────────────────────────────────────

  async isAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }

  // ─── Tradução de erros para o utilizador ─────────────────────────────────────

  private translateError(msg: string): string {
    const m = msg.toLowerCase();
    if (m.includes('not ready') || m.includes('edge function')) {
      return 'A integração com IA ainda não está configurada. Esta funcionalidade estará disponível em breve.';
    }
    if (m.includes('timeout')) {
      return 'A IA demorou demasiado a responder. Tenta novamente.';
    }
    if (m.includes('network') || m.includes('fetch')) {
      return 'Sem ligação. Verifica a tua internet e tenta novamente.';
    }
    if (m.includes('parse') || m.includes('json')) {
      return 'A IA devolveu uma resposta inesperada. Tenta novamente.';
    }
    if (m.includes('validation') || m.includes('campo inválido')) {
      return 'A resposta da IA não continha todos os campos necessários. Tenta novamente.';
    }
    return 'Ocorreu um erro ao processar a resposta da IA. Tenta novamente.';
  }
}

// ─── Instância singleton ──────────────────────────────────────────────────────

/**
 * Instância singleton do AIService.
 *
 * CONFIGURAÇÃO:
 *  - Desenvolvimento: MockProvider (sem API key, sem quota)
 *  - Produção: substituir por GeminiProvider na próxima etapa
 *
 * Para trocar de provider:
 *   import { aiService } from '../ai/services/AIService';
 *   import { GeminiProvider } from '../ai/providers/GeminiProvider';
 *   aiService.setProvider(new GeminiProvider({ edgeFunctionUrl: '...' }));
 */
import { MockProvider } from '../providers/MockProvider';

export const aiService = new AIServiceClass(new MockProvider());

export { AIServiceClass };
export type { AIProvider };
