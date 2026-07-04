/**
 * analyzeContent.ts — Prompt para análise estruturada de conteúdo académico
 *
 * Gera o prompt de sistema e de utilizador para a IA analisar um conteúdo
 * e devolver uma ContentAnalysis fortemente tipada.
 *
 * REGRA: Este prompt é a base de todas as outras funcionalidades.
 * Uma única análise alimenta: resumos, exercícios, flashcards e simulados.
 */

import type { PromptResult, AnalyzeContentParams } from '../types/ai';

export function buildAnalyzeContentPrompt(
  params: AnalyzeContentParams
): PromptResult {
  const { content, context } = params;
  const lang   = context.language ?? 'pt-PT';
  const school = context.schoolYear ? ` (${context.schoolYear})` : '';

  const systemPrompt = `
És um professor especialista em ${context.subjectName}${school}.
A tua tarefa é analisar um conteúdo académico e devolver uma análise estruturada.

REGRAS OBRIGATÓRIAS:
1. Responde APENAS com JSON válido, sem texto antes ou depois, sem markdown.
2. O JSON deve seguir EXACTAMENTE a estrutura definida.
3. Usa linguagem clara e adequada ao nível académico.
4. Idioma de resposta: ${lang}.

ESTRUTURA JSON OBRIGATÓRIA:
{
  "contentTitle": "string",
  "subject": "string",
  "keyConcepts": [
    { "term": "string", "definition": "string", "importance": "high|medium|low" }
  ],
  "learningObjectives": [
    { "description": "string", "bloomLevel": "lembrar|compreender|aplicar|analisar|avaliar|criar" }
  ],
  "topicSummary": "string (2-3 frases)",
  "studyTips": ["string"],
  "suggestedDifficulty": "facil|medio|dificil|muito_dificil",
  "relatedTopics": ["string"],
  "analysedAt": "ISO timestamp"
}
`.trim();

  const userPrompt = `
Analisa o seguinte conteúdo académico:

DISCIPLINA: ${content.subject}
TÍTULO: ${content.title}
DESCRIÇÃO: ${content.description}
${content.observations ? `OBSERVAÇÕES: ${content.observations}` : ''}
${content.date ? `DATA DE ESTUDO: ${content.date}` : ''}
${context.topics?.length ? `TÓPICOS IDENTIFICADOS: ${context.topics.join(', ')}` : ''}

Devolve a análise completa em JSON.
`.trim();

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      feature:     'analyze_content',
      subject:     content.subject,
      difficulty:  context.difficulty,
      builtAt:     new Date().toISOString(),
    },
  };
}
