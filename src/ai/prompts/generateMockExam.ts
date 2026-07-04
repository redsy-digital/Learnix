/**
 * generateMockExam.ts — Prompt para geração de simulados completos
 */

import type { PromptResult, GenerateMockExamParams } from '../types/ai';

export function buildGenerateMockExamPrompt(
  params: GenerateMockExamParams
): PromptResult {
  const { subjects, contents, contexts, totalQs = 20, timeMins = 90 } = params;
  const lang = contexts[0]?.language ?? 'pt-PT';

  const contentsStr = contents.map((c, i) =>
    `${i + 1}. [${c.subject}] ${c.title}: ${c.description.substring(0, 200)}…`
  ).join('\n');

  const qPerSubject = Math.ceil(totalQs / subjects.length);

  const systemPrompt = `
És um professor a criar um simulado de exame académico.

REGRAS OBRIGATÓRIAS:
1. Responde APENAS com JSON válido, sem markdown.
2. Total de questões: ${totalQs} (aprox. ${qPerSubject} por disciplina).
3. Duração: ${timeMins} minutos.
4. Varia os tipos de questão (multiple-choice, true-false, open, calculation).
5. Inclui questões de vários níveis de dificuldade.
6. Idioma: ${lang}.

ESTRUTURA JSON OBRIGATÓRIA:
{
  "id": "string",
  "title": "string",
  "description": "string",
  "sections": [
    {
      "title": "string",
      "subject": "string",
      "questions": [{ /* estrutura Question */ }],
      "points": number
    }
  ],
  "totalQuestions": number,
  "totalPoints": number,
  "timeLimitMins": number,
  "difficulty": "facil|medio|dificil|muito_dificil",
  "generatedAt": "ISO timestamp"
}
`.trim();

  const userPrompt = `
Cria um simulado com base nos seguintes conteúdos:

DISCIPLINAS: ${subjects.join(', ')}
DURAÇÃO: ${timeMins} minutos
TOTAL DE QUESTÕES: ${totalQs}

CONTEÚDOS A INCLUIR:
${contentsStr}

O simulado deve simular as condições reais de um exame e cobrir os pontos mais importantes de cada disciplina.
`.trim();

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      feature:  'generate_mock_exam',
      builtAt:  new Date().toISOString(),
    },
  };
}
