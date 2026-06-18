import { describe, expect, it } from 'vitest';
import {
  checkAnswer,
  convertVolume,
  createFinalState,
  createEndlessPracticeState,
  createPracticeState,
  ENDLESS_QUESTION_BANK,
  formatNumber,
  isSlideDevModeShortcut,
  isPracticeFinalShortcut,
  makeQuestion,
  makeEndlessQuestion,
  resolveEndlessPracticeAnswer,
  resolveFinalAnswer,
  resolvePracticeAnswer
} from '../src/quizEngine.js';

describe('volume conversion', () => {
  it('converts within the liter ladder by powers of ten', () => {
    expect(convertVolume(4.2, 'L', 'mL')).toBe(4200);
    expect(convertVolume(750, 'mL', 'dL')).toBe(7.5);
    expect(convertVolume(360, 'cm3', 'dL')).toBe(3.6);
  });

  it('uses the geometry links 1 cm3 = 1 mL and 1 dm3 = 1 L', () => {
    expect(convertVolume(900, 'cm3', 'mL')).toBe(900);
    expect(convertVolume(1200, 'cm3', 'L')).toBe(1.2);
    expect(convertVolume(2.5, 'dm3', 'cL')).toBe(250);
  });

  it('accepts decimal commas and small rounding differences when checking answers', () => {
    expect(checkAnswer('7,5', 7.5)).toBe(true);
    expect(checkAnswer('1.20', 1.2)).toBe(true);
    expect(checkAnswer('1,3', 1.2)).toBe(false);
  });

  it('formats examples without a thousands separator', () => {
    expect(formatNumber(1200)).toBe('1200');
    expect(formatNumber(1800)).toBe('1800');
    expect(formatNumber(1.25)).toBe('1,25');
    expect(makeQuestion(7).prompt).toBe('1200 cm3 = ... L');
  });
});

describe('practice game state', () => {
  it('restarts the schema round when more than ten answers are wrong', () => {
    let state = createPracticeState(20);
    for (let index = 0; index < 11; index += 1) {
      state = resolvePracticeAnswer(state, false);
    }

    expect(state.wrong).toBe(11);
    expect(state.shouldRestart).toBe(true);
    expect(state.readyForFinal).toBe(false);
  });

  it('opens the final round after twenty questions with fewer than ten wrong', () => {
    let state = createPracticeState(20);
    for (let index = 0; index < 12; index += 1) {
      state = resolvePracticeAnswer(state, true);
    }
    for (let index = 0; index < 8; index += 1) {
      state = resolvePracticeAnswer(state, false);
    }

    expect(state.current).toBe(20);
    expect(state.wrong).toBe(8);
    expect(state.readyForFinal).toBe(true);
    expect(state.shouldRestart).toBe(false);
  });
});

describe('final game state', () => {
  it('resets the streak to zero after a wrong answer', () => {
    let state = createFinalState();
    state = resolveFinalAnswer(state, true);
    state = resolveFinalAnswer(state, true);
    state = resolveFinalAnswer(state, false);

    expect(state.correctStreak).toBe(0);
    expect(state.wrong).toBe(1);
    expect(state.won).toBe(false);
  });

  it('wins after ten consecutive correct answers', () => {
    let state = createFinalState();
    for (let index = 0; index < 10; index += 1) {
      state = resolveFinalAnswer(state, true);
    }

    expect(state.correctStreak).toBe(10);
    expect(state.won).toBe(true);
  });
});

describe('endless extra practice', () => {
  it('offers varied volume conversions including geometric units', () => {
    const pairs = ENDLESS_QUESTION_BANK.map((question) => `${question.from}->${question.to}`);

    expect(pairs).toContain('cm3->dm3');
    expect(pairs).toContain('dm3->mL');
    expect(pairs).toContain('L->mL');
    expect(pairs).toContain('cm3->cL');
    expect(new Set(pairs).size).toBeGreaterThan(10);
  });

  it('tracks correct, wrong, total, current streak and best streak', () => {
    let state = createEndlessPracticeState();

    state = resolveEndlessPracticeAnswer(state, true);
    state = resolveEndlessPracticeAnswer(state, true);
    state = resolveEndlessPracticeAnswer(state, false);
    state = resolveEndlessPracticeAnswer(state, true);

    expect(state.played).toBe(4);
    expect(state.correct).toBe(3);
    expect(state.wrong).toBe(1);
    expect(state.correctStreak).toBe(1);
    expect(state.bestStreak).toBe(2);
  });

  it('builds endless questions from the varied bank', () => {
    const question = makeEndlessQuestion(0);

    expect(question.prompt).toBe('1250 cm3 = ... dm3');
    expect(question.answer).toBe(1.25);
  });
});

describe('hidden shortcuts', () => {
  it('recognizes shift-Q as a dev mode toggle while viewing slides', () => {
    expect(isSlideDevModeShortcut({ shiftKey: true, key: 'Q' }, 'slides')).toBe(true);
    expect(isSlideDevModeShortcut({ shiftKey: true, key: 'q' }, 'slides')).toBe(true);
    expect(isSlideDevModeShortcut({ shiftKey: true, key: 'q' }, 'practice')).toBe(false);
    expect(isSlideDevModeShortcut({ shiftKey: false, key: 'q' }, 'slides')).toBe(false);
  });

  it('recognizes shift-Q only while practicing in round one', () => {
    expect(isPracticeFinalShortcut({ shiftKey: true, key: 'Q' }, 'practice')).toBe(true);
    expect(isPracticeFinalShortcut({ shiftKey: true, key: 'q' }, 'practice-feedback')).toBe(true);
    expect(isPracticeFinalShortcut({ shiftKey: false, key: 'q' }, 'practice')).toBe(false);
    expect(isPracticeFinalShortcut({ shiftKey: true, key: 'q' }, 'slides')).toBe(false);
  });
});
