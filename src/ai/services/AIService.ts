/**
 * AIService.ts — Camada única de acesso à IA para todo o Learnix
 *
 * REGRA ABSOLUTA: nenhum componente React, hook ou service do Learnix
 * poderá importar GeminiProvider, MockProvider ou qualquer prompt/parser
 * directamente. Toda a comunicação com IA passa por esta classe.
 *
 * ESTADO ACTUAL (Etapa 13):
 *  - analyzeContent()     → GeminiProvider (REAL — via Edge Function)
 *  - generateExercises()  → GeminiProvider (REAL — via Edge Function)
 *  - restantes            → MockProvider (activar progressivamente)
 *
 * A troca entre providers é totalmente transparente para o resto da aplicação.
 * Os callers apenas usam AIService.método() e recebem AIResponse<T>.
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
import { buildAnalyzeContentPrompt }     from '../prompts/analyzeContent';
import { buildGenerateExercisesPrompt }  from '../prompts/generateExercises';
import { buildGenerateSummaryPrompt }    from '../prompts/generateSummary';
import { buildGenerateFlashcardsPrompt } from '../prompts/generateFlashcards';
import { buildGenerateMockExamPrompt }   from '../prompts/generateMockExam';
import { buildExplainAnswerPrompt }      from '../prompts/explainAnswer';

// Parsers
import {
  parseContentAnalysis,
  parseExercise,
  parseSummary,
  parseFlashcardDeck,
  parseMockExam,
  parseAnswerExplanation,
} from '../parsers';

// Providers
import { GeminiProvider } from '../providers/GeminiProvider';
import { MockProvider }   from '../providers/MockProvider';

// ─── AIService class ──────────────────────────────────────────────────────────

class AIServiceClass {
  /**
   * Provider principal — usado para analyzeContent (real).
   * Actualmente: GeminiProvider via Edge Function.
   */
  private primaryProvider: AIProvider;

  /**
   * Provider de fallback — usado para funcionalidades ainda não integradas.
   * Actualmente: MockProvider para exercícios, resumos, flashcards, simulados.
   */
  private mockProvider: AIProvider;

  constructor(primary: AIProvider, mock: AIProvider) {
    this.primaryProvider = primary;
    this.mockProvider    = mock;
  }

  /** Troca o provider principal (Gemini ↔ outro modelo) */
  setPrimaryProvider(provider: AIProvider): void {
    this.primaryProvider = provider;
  }

  get providerName(): AIProviderName {
    return this.primaryProvider.name;
  }

  // ─── Método interno de execução ─────────────────────────────────────────────

  private async execute<T>(
    featureName:  string,
    provider:     AIProvider,
    systemPrompt: string,
    userPrompt:   string,
    parse:        (rawText: string) => T,
  ): Promise<AIResponse<T>> {
    const startTime = Date.now();

    try {
      const raw = await provider.complete(systemPrompt, userPrompt, {
        temperature: 0.7,
        maxTokens:   2048,
        timeoutMs:   30_000,
      });

      const data = parse(raw.text);

      return {
        success:    true,
        data,
        provider:   provider.name,
        model:      raw.model,
        latencyMs:  raw.latencyMs,
        tokensUsed: raw.tokensUsed,
      };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`[AIService] ${featureName} falhou (${provider.name}):`, message);

      return {
        success:   false,
        error:     this.translateError(message),
        provider:  provider.name,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // ─── Operações públicas ──────────────────────────────────────────────────────

  /**
   * analyzeContent — usa GeminiProvider REAL.
   * Primeiro método integrado com a API real na Etapa 11.
   * Analisa conteúdo académico e devolve ContentAnalysis estruturada.
   */
  async analyzeContent(
    params: AnalyzeContentParams
  ): Promise<AIResponse<ContentAnalysis>> {
    const { systemPrompt, userPrompt } = buildAnalyzeContentPrompt(params);
    return this.execute(
      'analyzeContent',
      this.primaryProvider,   // ← GeminiProvider real
      systemPrompt,
      userPrompt,
      parseContentAnalysis,
    );
  }

  /**
   * generateExercises — usa GeminiProvider REAL (Etapa 13).
   * Se params.analysis não for fornecido, o chamador deve ter
   * já executado analyzeContent() antes — ver analyzeAndGenerateExercises().
   */
  async generateExercises(
    params: GenerateExercisesParams
  ): Promise<AIResponse<Exercise>> {
    const { systemPrompt, userPrompt } = buildGenerateExercisesPrompt(params);
    return this.execute(
      'generateExercises',
      this.primaryProvider,   // ← GeminiProvider real (Etapa 13)
      systemPrompt,
      userPrompt,
      parseExercise,
    );
  }

  /**
   * generateSummary — MockProvider (activar Gemini em etapa futura)
   */
  async generateSummary(
    params: GenerateSummaryParams
  ): Promise<AIResponse<Summary>> {
    const { systemPrompt, userPrompt } = buildGenerateSummaryPrompt(params);
    return this.execute(
      'generateSummary',
      this.mockProvider,
      systemPrompt,
      userPrompt,
      parseSummary,
    );
  }

  /**
   * generateFlashcards — MockProvider (activar Gemini em etapa futura)
   */
  async generateFlashcards(
    params: GenerateFlashcardsParams
  ): Promise<AIResponse<FlashcardDeck>> {
    const { systemPrompt, userPrompt } = buildGenerateFlashcardsPrompt(params);
    return this.execute(
      'generateFlashcards',
      this.mockProvider,
      systemPrompt,
      userPrompt,
      parseFlashcardDeck,
    );
  }

  /**
   * generateMockExam — MockProvider (activar Gemini em etapa futura)
   */
  async generateMockExam(
    params: GenerateMockExamParams
  ): Promise<AIResponse<MockExam>> {
    const { systemPrompt, userPrompt } = buildGenerateMockExamPrompt(params);
    return this.execute(
      'generateMockExam',
      this.mockProvider,
      systemPrompt,
      userPrompt,
      parseMockExam,
    );
  }

  /**
   * explainAnswer — MockProvider (activar Gemini em etapa futura)
   */
  async explainAnswer(
    params: ExplainAnswerParams
  ): Promise<AIResponse<AnswerExplanation>> {
    const { systemPrompt, userPrompt } = buildExplainAnswerPrompt(params);
    return this.execute(
      'explainAnswer',
      this.mockProvider,
      systemPrompt,
      userPrompt,
      parseAnswerExplanation,
    );
  }

  /**
   * Fluxo completo: analisa (Gemini real) + gera exercícios (Mock por agora)
   */
  async analyzeAndGenerateExercises(
    params: Omit<GenerateExercisesParams, 'analysis'>
  ): Promise<{
    analysis:  AIResponse<ContentAnalysis>;
    exercises: AIResponse<Exercise>;
  }> {
    const analysis  = await this.analyzeContent({ content: params.content, context: params.context });
    const exercises = await this.generateExercises({
      ...params,
      analysis: analysis.success ? analysis.data : undefined,
    });
    return { analysis, exercises };
  }

  /** Verifica se o provider principal está disponível */
  async isAvailable(): Promise<boolean> {
    return this.primaryProvider.isAvailable();
  }

  // ─── Tradução de erros ────────────────────────────────────────────────────────

  private translateError(msg: string): string {
    const m = msg.toLowerCase();
    if (m.includes('sessão') || m.includes('inicia sessão') || m.includes('auth')) {
      return 'A tua sessão expirou. Inicia sessão novamente e tenta outra vez.';
    }
    if (m.includes('quota') || m.includes('limite')) {
      return 'Limite de IA atingido. Aguarda alguns minutos e tenta novamente.';
    }
    if (m.includes('timeout') || m.includes('demorou')) {
      return 'A IA demorou demasiado a responder. Tenta novamente.';
    }
    // Erro de CORS tem mensagem própria — nunca deve cair no ramo genérico
    // de "sem internet" abaixo, ou a causa real fica escondida do utilizador.
    if (m.includes('não está autorizado a comunicar')) {
      return msg; // mensagem já está em português e é específica o suficiente
    }
    if (m.includes('sem ligação à internet')) {
      return 'Sem ligação. Verifica a tua internet e tenta novamente.';
    }
    if (m.includes('network') || m.includes('fetch')) {
      return 'Não foi possível contactar o serviço de IA. Tenta novamente em instantes.';
    }
    if (m.includes('parse') || m.includes('json') || m.includes('campo inválido')) {
      return 'A IA devolveu uma resposta inesperada. Tenta novamente.';
    }
    if (m.includes('not ready') || m.includes('edge function') || m.includes('indisponível')) {
      return 'O serviço de IA está temporariamente indisponível. Tenta mais tarde.';
    }
    return 'Ocorreu um erro ao processar a resposta da IA. Tenta novamente.';
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

/**
 * Instância singleton do AIService.
 *
 * primaryProvider = GeminiProvider (analyzeContent real via Edge Function)
 * mockProvider    = MockProvider   (todas as outras funcionalidades por agora)
 */
export const aiService = new AIServiceClass(
  new GeminiProvider(),   // real — via Edge Function + Supabase Secrets
  new MockProvider(),     // mock — para funcionalidades não integradas ainda
);

export { AIServiceClass };
export type { AIProvider };
