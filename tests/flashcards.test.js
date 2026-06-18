import { describe, expect, it } from 'vitest';
import {
  createFlashcardState,
  FLASHCARDS,
  flipFlashcard,
  getFlashcard,
  resolveFlashcard
} from '../src/flashcards.js';

describe('flashcards', () => {
  it('starts on the first card with a clean score', () => {
    const state = createFlashcardState();

    expect(state).toMatchObject({
      index: 0,
      known: 0,
      practice: 0,
      flipped: false,
      completed: false
    });
    expect(getFlashcard(state)).toBe(FLASHCARDS[0]);
  });

  it('flips between question and answer', () => {
    const state = createFlashcardState();

    expect(flipFlashcard(state).flipped).toBe(true);
    expect(flipFlashcard(flipFlashcard(state)).flipped).toBe(false);
  });

  it('tracks known and practice answers until the deck is complete', () => {
    let state = createFlashcardState();

    state = resolveFlashcard({ ...state, flipped: true }, true);
    expect(state).toMatchObject({ index: 1, known: 1, practice: 0, flipped: false, completed: false });

    for (let index = 1; index < FLASHCARDS.length; index += 1) {
      state = resolveFlashcard({ ...state, flipped: true }, false);
    }

    expect(state.completed).toBe(true);
    expect(state.known).toBe(1);
    expect(state.practice).toBe(FLASHCARDS.length - 1);
  });
});
