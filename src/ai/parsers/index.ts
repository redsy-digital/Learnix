/**
 * parsers/index.ts — Parsers que transformam texto crú da IA em tipos TypeScript
 *
 * Cada parser:
 *  1. Recebe o texto crú da RawProviderResponse
 *  2. Faz parse JSON via parseAIJson (com limpeza de markdown)
 *  3. Valida e normaliza via validator correspondente
 *  4. Devolve tipo TypeScript fortemente tipado
 *
 * Nunca lança erros não controlados — lança apenas AIParseError ou AIValidationError.
 */

import { parseAIJson } from '../validators/responseValidator';
import {
  validateContentAnalysis,
  validateExercise,
  validateSummary,
  validateFlashcardDeck,
  validateMockExam,
  validateAnswerExplanation,
} from '../validators/responseValidator';

import type {
  ContentAnalysis,
  Exercise,
  Summary,
  FlashcardDeck,
  MockExam,
  AnswerExplanation,
} from '../types/ai';

// ─── analysisParser ───────────────────────────────────────────────────────────

export function parseContentAnalysis(rawText: string): ContentAnalysis {
  const json = parseAIJson(rawText, 'analyze_content');
  return validateContentAnalysis(json);
}

// ─── exerciseParser ───────────────────────────────────────────────────────────

export function parseExercise(rawText: string): Exercise {
  const json = parseAIJson(rawText, 'generate_exercises');
  return validateExercise(json);
}

// ─── summaryParser ────────────────────────────────────────────────────────────

export function parseSummary(rawText: string): Summary {
  const json = parseAIJson(rawText, 'generate_summary');
  return validateSummary(json);
}

// ─── flashcardParser ──────────────────────────────────────────────────────────

export function parseFlashcardDeck(rawText: string): FlashcardDeck {
  const json = parseAIJson(rawText, 'generate_flashcards');
  return validateFlashcardDeck(json);
}

// ─── mockExamParser ───────────────────────────────────────────────────────────

export function parseMockExam(rawText: string): MockExam {
  const json = parseAIJson(rawText, 'generate_mock_exam');
  return validateMockExam(json);
}

// ─── answerExplanationParser ──────────────────────────────────────────────────

export function parseAnswerExplanation(rawText: string): AnswerExplanation {
  const json = parseAIJson(rawText, 'explain_answer');
  return validateAnswerExplanation(json);
}
