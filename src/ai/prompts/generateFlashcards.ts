/**
 * generateFlashcards.ts — Prompt para geração de flashcards de memorização
 */

import type { PromptResult, GenerateFlashcardsParams } from '../types/ai';

export function buildGenerateFlashcardsPrompt(
  params: GenerateFlashcardsParams
): PromptResult {
  const { content, context, count = 10, analysis } = params;
  const lang = context.language ?? 'pt-PT';

  const analysisContext = analysis
    ? `CONCEITOS-CHAVE IDENTIFICADOS: ${analysis.keyConcepts.map(k => k.term).join(', ')}`
    : '';

  const systemPrompt = `
És um especialista em técnicas de memorização e aprendizagem espaçada.
Cria flashcards académicos eficazes para o método de repetição espaçada (Anki/SRS).

REGRAS OBRIGATÓRIAS:
1. Responde APENAS com JSON válido, sem markdown.
2. Cria exactamente ${count} flashcards.
3. Cada flashcard deve testar UM único conceito.
4. O "front" deve ser uma pergunta clara e directa.
5. O "back" deve ser a resposta mais concisa possível.
6. Idioma: ${lang}.

ESTRUTURA JSON OBRIGATÓRIA:
{
  "id": "string",
  "subjectName": "string",
  "topic": "string",
  "cards": [
    {
      "id": "string",
      "front": "string (pergunta ou termo)",
      "back": "string (resposta ou definição — concisa)",
      "hint": "string|null (dica opcional)",
      "topic": "string",
      "difficulty": "facil|medio|dificil|muito_dificil",
      "tags": ["string"]
    }
  ],
  "generatedAt": "ISO timestamp"
}
`.trim();

  const userPrompt = `
Cria ${count} flashcards para memorização sobre:

DISCIPLINA: ${content.subject}
TÍTULO: ${content.title}
DESCRIÇÃO: ${content.description}
${content.observations ? `OBSERVAÇÕES: ${content.observations}` : ''}
${analysisContext}
${context.schoolYear ? `ANO ESCOLAR: ${context.schoolYear}` : ''}

Foca nos conceitos mais importantes e nos pontos frequentemente esquecidos.
`.trim();

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      feature:     'generate_flashcards',
      subject:     content.subject,
      difficulty:  context.difficulty,
      builtAt:     new Date().toISOString(),
    },
  };
}
