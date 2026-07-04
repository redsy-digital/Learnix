/**
 * explainAnswer.ts — Prompt para explicação pedagógica de respostas
 *
 * Gera uma explicação contextualizada e pedagógica da resposta do aluno,
 * incluindo o porquê do erro (se errou) e dicas de estudo relacionadas.
 */

import type { PromptResult, ExplainAnswerParams } from '../types/ai';

export function buildExplainAnswerPrompt(
  params: ExplainAnswerParams
): PromptResult {
  const { question, studentAnswer, isCorrect, context } = params;
  const lang = context.language ?? 'pt-PT';

  const systemPrompt = `
És um tutor especialista em ${context.subjectName}.
A tua tarefa é explicar a resposta de um aluno de forma pedagógica e motivadora.

REGRAS OBRIGATÓRIAS:
1. Responde APENAS com JSON válido, sem markdown.
2. Sê claro, preciso e encorajador — nunca condescendente.
3. Se a resposta estiver errada, explica o erro sem desmotivar.
4. Idioma: ${lang}.

ESTRUTURA JSON OBRIGATÓRIA:
{
  "questionText": "string",
  "studentAnswer": "string",
  "correctAnswer": "string",
  "isCorrect": boolean,
  "explanation": "string (explicação conceptual detalhada)",
  "whyWrong": "string|null (só se isCorrect=false — porquê o erro é comum)",
  "studyTip": "string (dica prática de estudo)",
  "relatedConcepts": ["string"]
}
`.trim();

  const userPrompt = `
O aluno respondeu a esta questão:

QUESTÃO: ${question.questionText}
TIPO: ${question.type}
RESPOSTA DO ALUNO: ${studentAnswer}
RESPOSTA CORRECTA: ${question.correctAnswer}
RESULTADO: ${isCorrect ? 'CORRECTO ✓' : 'INCORRECTO ✗'}
${question.topic ? `TÓPICO: ${question.topic}` : ''}
${context.schoolYear ? `ANO ESCOLAR: ${context.schoolYear}` : ''}

Gera uma explicação pedagógica completa em JSON.
`.trim();

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      feature:    'explain_answer',
      subject:    context.subjectName,
      builtAt:    new Date().toISOString(),
    },
  };
}
