/**
 * generateSummary.ts — Prompt para geração de resumos estruturados
 */

import type { PromptResult, GenerateSummaryParams } from '../types/ai';

export function buildGenerateSummaryPrompt(
  params: GenerateSummaryParams
): PromptResult {
  const { content, context, style = 'mixed', analysis } = params;
  const lang = context.language ?? 'pt-PT';

  const analysisContext = analysis
    ? `
ANÁLISE PRÉVIA DISPONÍVEL:
- Conceitos-chave: ${analysis.keyConcepts.map(k => `${k.term}: ${k.definition}`).join(' | ')}
- Objectivos: ${analysis.learningObjectives.map(o => o.description).join('; ')}
- Tópicos relacionados: ${analysis.relatedTopics?.join(', ') ?? 'N/A'}
`.trim()
    : '';

  const styleGuide =
    style === 'bullet-points' ? 'Usa predominantemente listas de tópicos. Minimiza texto corrido.' :
    style === 'narrative'     ? 'Usa texto corrido e parágrafos explicativos. Minimiza listas.' :
    'Equilibra texto corrido com listas de tópicos onde fizer sentido.';

  const systemPrompt = `
És um professor especialista em ${context.subjectName} a criar resumos académicos.

REGRAS OBRIGATÓRIAS:
1. Responde APENAS com JSON válido, sem markdown.
2. Estilo: ${styleGuide}
3. O resumo deve ser completo mas conciso.
4. Inclui fórmulas ou regras chave se relevantes.
5. Idioma: ${lang}.

ESTRUTURA JSON OBRIGATÓRIA:
{
  "id": "string",
  "subjectName": "string",
  "contentTitle": "string",
  "introduction": "string (parágrafo introdutório)",
  "sections": [
    {
      "title": "string",
      "content": "string (explicação da secção)",
      "bullets": ["string (pontos-chave)"]
    }
  ],
  "keyFormulas": ["string (fórmulas/regras importantes, null se não aplicável)"],
  "conclusion": "string (síntese final)",
  "studyChecklist": ["string (o que o aluno deve dominar)"],
  "generatedAt": "ISO timestamp"
}
`.trim();

  const userPrompt = `
Cria um resumo académico completo para o seguinte conteúdo:

DISCIPLINA: ${content.subject}
TÍTULO: ${content.title}
DESCRIÇÃO: ${content.description}
${content.observations ? `OBSERVAÇÕES DO PROFESSOR: ${content.observations}` : ''}
${analysisContext}
${context.schoolYear ? `ANO ESCOLAR: ${context.schoolYear}` : ''}

O resumo deve cobrir todos os aspectos essenciais e ser útil para revisão antes de exames.
`.trim();

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      feature:     'generate_summary',
      subject:     content.subject,
      difficulty:  context.difficulty,
      builtAt:     new Date().toISOString(),
    },
  };
}
