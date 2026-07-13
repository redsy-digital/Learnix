/**
 * generateExercises.ts — Prompt para geração de exercícios personalizados
 *
 * Pode reutilizar uma ContentAnalysis prévia para gerar exercícios mais
 * contextualizados sem repetir a análise do conteúdo.
 */

import type { PromptResult, GenerateExercisesParams } from '../types/ai';

export function buildGenerateExercisesPrompt(
  params: GenerateExercisesParams
): PromptResult {
  const { content, context, count = 5, types, analysis } = params;
  const lang       = context.language ?? 'pt-PT';
  const difficulty = context.difficulty ?? analysis?.suggestedDifficulty ?? 'medio';
  // Etapa 13: suporta escolha múltipla, verdadeiro/falso, resposta curta e desenvolvimento.
  // 'open' cobre tanto resposta curta como desenvolvimento — o texto do enunciado
  // indica qual das duas formas a IA deve pedir.
  const typesList  = types?.join(', ') ?? 'multiple-choice, true-false, open';

  // Contexto enriquecido se análise prévia disponível
  const analysisContext = analysis
    ? `
ANÁLISE PRÉVIA DISPONÍVEL (usa como base):
- Conceitos-chave: ${analysis.keyConcepts.map(k => k.term).join(', ')}
- Objectivos: ${analysis.learningObjectives.map(o => o.description).join('; ')}
- Dificuldade sugerida: ${analysis.suggestedDifficulty}
`.trim()
    : '';

  const systemPrompt = `
És um professor especialista em ${context.subjectName} a criar exercícios académicos.

REGRAS OBRIGATÓRIAS:
1. Responde APENAS com JSON válido, sem markdown, sem texto extra.
2. Cria exactamente ${count} questões.
3. Tipos permitidos: ${typesList}.
   - "multiple-choice": 4 opções (A-D), exactamente 1 correcta.
   - "true-false": 2 opções (Verdadeiro/Falso).
   - "open": pode ser resposta curta (1 frase) OU desenvolvimento (parágrafo) — decide consoante a complexidade do tema; indica no enunciado qual é esperado.
4. Nível de dificuldade: ${difficulty}.
5. Idioma: ${lang}.
6. Inclui SEMPRE explicação detalhada para cada resposta.
7. Cada questão deve indicar o "topic" (tema relacionado dentro da disciplina).

ESTRUTURA JSON OBRIGATÓRIA:
{
  "id": "string",
  "subjectName": "string",
  "contentTitle": "string",
  "questions": [
    {
      "id": "string",
      "type": "multiple-choice|true-false|open|fill-blank|calculation",
      "questionText": "string",
      "options": [{ "id": "A|B|C|D", "text": "string", "isCorrect": boolean }],
      "correctAnswer": "string",
      "explanation": "string (explicação pedagógica detalhada)",
      "difficulty": "facil|medio|dificil|muito_dificil",
      "topic": "string",
      "hint": "string (opcional)",
      "points": number
    }
  ],
  "totalPoints": number,
  "estimatedMins": number,
  "difficulty": "facil|medio|dificil|muito_dificil",
  "generatedAt": "ISO timestamp"
}

NOTA: Para questões que não são multiple-choice ou true-false, o campo "options" deve ser null.
`.trim();

  const userPrompt = `
Gera ${count} exercícios sobre o seguinte conteúdo:

DISCIPLINA: ${content.subject}
TÍTULO: ${content.title}
DESCRIÇÃO: ${content.description}
${content.observations ? `OBSERVAÇÕES: ${content.observations}` : ''}
${analysisContext}
${context.schoolYear ? `ANO ESCOLAR: ${context.schoolYear}` : ''}

Os exercícios devem cobrir os aspectos mais importantes do conteúdo.
Varia os tipos de questão para avaliar diferentes competências.
`.trim();

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      feature:     'generate_exercises',
      subject:     content.subject,
      difficulty,
      builtAt:     new Date().toISOString(),
    },
  };
}
