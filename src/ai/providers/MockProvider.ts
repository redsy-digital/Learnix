/**
 * MockProvider.ts — Fornecedor mock para desenvolvimento e testes
 *
 * Devolve respostas JSON pré-definidas que simulam respostas reais do Gemini.
 * Permite desenvolver e testar toda a pipeline de IA sem:
 *  - consumir quota da API
 *  - necessitar de chave de API
 *  - depender de conectividade
 *
 * As respostas estão em formato JSON que os parsers reais também consomem —
 * garantindo que o pipeline completo é testável.
 */

import type { AIProvider, AICallOptions, RawProviderResponse } from './AIProvider';
import type { AIProviderName } from '../types/ai';

// ─── Respostas mock por keyword do prompt ────────────────────────────────────

const MOCK_RESPONSES: Record<string, object> = {

  // Análise de conteúdo
  analyze_content: {
    contentTitle:       'Derivadas e Regra da Cadeia',
    subject:            'Matemática',
    keyConcepts: [
      { term: 'Derivada',        definition: 'Taxa de variação instantânea de uma função', importance: 'high' },
      { term: 'Regra da Cadeia', definition: 'Método para derivar funções compostas f(g(x))', importance: 'high' },
      { term: 'Função composta', definition: 'Função da forma h(x) = f(g(x))', importance: 'medium' },
    ],
    learningObjectives: [
      { description: 'Identificar funções compostas', bloomLevel: 'compreender' },
      { description: 'Aplicar a regra da cadeia', bloomLevel: 'aplicar' },
      { description: 'Resolver problemas com derivadas', bloomLevel: 'analisar' },
    ],
    topicSummary:    'A regra da cadeia permite calcular a derivada de funções compostas multiplicando a derivada da função exterior pela derivada da função interior.',
    studyTips:       ['Identifica sempre a função exterior e interior antes de derivar', 'Pratica com funções trigonométricas compostas', 'Revê as regras básicas de derivação'],
    suggestedDifficulty: 'medio',
    relatedTopics:   ['Regra do Produto', 'Regra do Quociente', 'Derivadas de funções trigonométricas'],
    analysedAt:      new Date().toISOString(),
  },

  // Geração de exercícios
  generate_exercises: {
    id:          'ex_mock_001',
    subjectName: 'Matemática',
    contentTitle: 'Derivadas e Regra da Cadeia',
    questions: [
      {
        id: 'q1', type: 'multiple-choice',
        questionText: 'Qual é a derivada de h(x) = (3x² + 2)⁵ pela Regra da Cadeia?',
        options: [
          { id: 'A', text: '5(3x² + 2)⁴',      isCorrect: false },
          { id: 'B', text: '30x(3x² + 2)⁴',     isCorrect: true  },
          { id: 'C', text: '15x(3x² + 2)⁴',     isCorrect: false },
          { id: 'D', text: '6x · 5(3x² + 2)⁴',  isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'h\'(x) = 5(3x²+2)⁴ · 6x = 30x(3x²+2)⁴. A função exterior é u⁵, a interior é 3x²+2 com derivada 6x.',
        difficulty: 'medio', topic: 'Regra da Cadeia', points: 2,
      },
      {
        id: 'q2', type: 'calculation',
        questionText: 'Calcula h\'(1) sendo h(x) = (2x+1)³.',
        options: undefined,
        correctAnswer: '24',
        explanation: 'h\'(x) = 3(2x+1)² · 2 = 6(2x+1)². h\'(1) = 6·9 = 54. Atenção: h\'(1)=6·(2·1+1)²=6·9=54.',
        difficulty: 'dificil', topic: 'Aplicação', points: 3,
      },
      {
        id: 'q3', type: 'true-false',
        questionText: 'A derivada de f(g(x)) é sempre igual a f\'(x) · g\'(x).',
        options: [
          { id: 'V', text: 'Verdadeiro', isCorrect: false },
          { id: 'F', text: 'Falso',      isCorrect: true  },
        ],
        correctAnswer: 'F',
        explanation: 'Falso. A forma correcta é f\'(g(x)) · g\'(x) — a derivada de f é avaliada em g(x), não em x.',
        difficulty: 'facil', topic: 'Conceito', points: 1,
      },
    ],
    totalPoints:   6,
    estimatedMins: 15,
    difficulty:    'medio',
    generatedAt:   new Date().toISOString(),
  },

  // Geração de resumo
  generate_summary: {
    id:           'sum_mock_001',
    subjectName:  'Matemática',
    contentTitle: 'Derivadas e Regra da Cadeia',
    introduction: 'A Regra da Cadeia é um dos teoremas fundamentais do Cálculo Diferencial que permite calcular derivadas de funções compostas de forma sistemática.',
    sections: [
      {
        title:   'Definição e Fórmula',
        content: 'Se h(x) = f(g(x)), então h\'(x) = f\'(g(x)) · g\'(x).',
        bullets: ['Identifica a função exterior f e a interior g', 'Deriva cada função separadamente', 'Multiplica as derivadas com atenção à composição'],
      },
      {
        title:   'Exemplos Práticos',
        content: 'Aplicação em funções polinomiais, trigonométricas e exponenciais.',
        bullets: ['(sin(x²))\'  = cos(x²) · 2x', '(e^(3x))\'   = 3e^(3x)', '((x²+1)⁴)\' = 4(x²+1)³ · 2x'],
      },
    ],
    keyFormulas:    ['h\'(x) = f\'(g(x)) · g\'(x)', 'Se u = g(x), então (f(u))\' = f\'(u) · u\''],
    conclusion:     'Dominar a Regra da Cadeia é essencial para resolver problemas de optimização e análise de funções complexas.',
    studyChecklist: ['Sei identificar funções compostas', 'Consigo aplicar a fórmula correctamente', 'Resolvo exercícios de vários tipos'],
    generatedAt:    new Date().toISOString(),
  },

  // Geração de flashcards
  generate_flashcards: {
    id:          'deck_mock_001',
    subjectName: 'Matemática',
    topic:       'Derivadas e Regra da Cadeia',
    cards: [
      { id: 'f1', front: 'O que é a Regra da Cadeia?', back: 'Regra que permite derivar funções compostas: (f∘g)\'(x) = f\'(g(x))·g\'(x)', difficulty: 'facil', tags: ['definição', 'cálculo'] },
      { id: 'f2', front: 'Qual é a derivada de sin(x²)?', back: 'cos(x²) · 2x = 2x·cos(x²)', hint: 'Função exterior: sin; interior: x²', difficulty: 'medio', tags: ['trigonometria', 'aplicação'] },
      { id: 'f3', front: 'Qual é a derivada de e^(kx)?', back: 'k · e^(kx), onde k é constante', difficulty: 'facil', tags: ['exponencial'] },
    ],
    generatedAt: new Date().toISOString(),
  },

  // Explicação de resposta
  explain_answer: {
    questionText:    'Qual é a derivada de h(x) = (3x²+2)⁵?',
    studentAnswer:   'A) 5(3x²+2)⁴',
    correctAnswer:   'B) 30x(3x²+2)⁴',
    isCorrect:       false,
    explanation:     'A Regra da Cadeia exige multiplicar a derivada exterior pela derivada interior. A derivada exterior de u⁵ é 5u⁴. A derivada interior de 3x²+2 é 6x. Logo: 5(3x²+2)⁴ · 6x = 30x(3x²+2)⁴.',
    whyWrong:        'Esqueceste-te de multiplicar pela derivada da função interior (3x²+2)\'=6x. Este é o passo crítico da Regra da Cadeia.',
    studyTip:        'Sempre escreve explicitamente u = g(x) e calcula u\' antes de aplicar a fórmula.',
    relatedConcepts: ['Função composta', 'Derivada de potência', 'Regra da Cadeia'],
  },

  // Simulado
  generate_mock_exam: {
    id:             'exam_mock_001',
    title:          'Simulado de Matemática — Cálculo Diferencial',
    description:    'Simulado com questões de derivadas e regra da cadeia',
    sections: [
      {
        title:   'Secção A — Conceitos',
        subject: 'Matemática',
        questions: [
          {
            id: 'eq1', type: 'multiple-choice',
            questionText: 'A derivada de f(x) = x³ é:',
            options: [
              { id: 'A', text: 'x²',  isCorrect: false },
              { id: 'B', text: '3x²', isCorrect: true  },
              { id: 'C', text: '3x',  isCorrect: false },
              { id: 'D', text: '3',   isCorrect: false },
            ],
            correctAnswer: 'B', explanation: 'Pela regra da potência: (xⁿ)\'= n·xⁿ⁻¹. Logo (x³)\'= 3x².',
            difficulty: 'facil', points: 1,
          },
        ],
        points: 10,
      },
    ],
    totalQuestions: 1,
    totalPoints:    10,
    timeLimitMins:  90,
    difficulty:     'medio',
    generatedAt:    new Date().toISOString(),
  },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export class MockProvider implements AIProvider {
  readonly name: AIProviderName = 'mock';

  /** Latência simulada em milissegundos (para simular realismo) */
  private readonly simulatedLatencyMs: number;

  constructor(simulatedLatencyMs = 800) {
    this.simulatedLatencyMs = simulatedLatencyMs;
  }

  async isAvailable(): Promise<boolean> {
    return true; // sempre disponível
  }

  async complete(
    systemPrompt: string,
    userPrompt:   string,
    _options?:    AICallOptions
  ): Promise<RawProviderResponse> {
    // Simular latência de rede
    await new Promise(resolve => setTimeout(resolve, this.simulatedLatencyMs));

    // Determinar qual resposta mock usar com base no conteúdo dos prompts
    const combinedPrompt = `${systemPrompt} ${userPrompt}`.toLowerCase();
    const mockKey = this.detectFeature(combinedPrompt);
    const mockData = MOCK_RESPONSES[mockKey] ?? MOCK_RESPONSES['generate_exercises'];

    return {
      text:      JSON.stringify(mockData),
      model:     'mock-provider-v1',
      latencyMs: this.simulatedLatencyMs,
      tokensUsed: 0,
    };
  }

  /**
   * Detecta a funcionalidade pedida com base em palavras-chave no prompt.
   * Permite reutilizar diferentes respostas mock por funcionalidade.
   */
  private detectFeature(prompt: string): string {
    if (prompt.includes('analisa') || prompt.includes('analise') || prompt.includes('analyze')) {
      return 'analyze_content';
    }
    if (prompt.includes('resumo') || prompt.includes('summary')) {
      return 'generate_summary';
    }
    if (prompt.includes('flashcard')) {
      return 'generate_flashcards';
    }
    if (prompt.includes('simulado') || prompt.includes('mock exam') || prompt.includes('exame')) {
      return 'generate_mock_exam';
    }
    if (prompt.includes('explica') || prompt.includes('explain') || prompt.includes('resposta')) {
      return 'explain_answer';
    }
    // Default: exercícios
    return 'generate_exercises';
  }
}
