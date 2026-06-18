import { describe, expect, it } from 'vitest';
import { checkNumberPuzzle, NUMBER_PUZZLE } from '../src/numberPuzzle.js';

describe('number puzzle', () => {
  it('has horizontal clues a through p and vertical clues a through n', () => {
    expect(NUMBER_PUZZLE.horizontal.map(([letter]) => letter)).toEqual('abcdefghijklmnop'.split(''));
    expect(NUMBER_PUZZLE.vertical.map(([letter]) => letter)).toEqual('abcdefghijklmn'.split(''));
  });

  it('keeps correct digits and clears wrong digits when checking', () => {
    const solution = NUMBER_PUZZLE.solutionRows.join('').split('');
    const attempt = [...solution];
    attempt[0] = '9';
    attempt[10] = '8';

    const result = checkNumberPuzzle(attempt);

    expect(result.complete).toBe(false);
    expect(result.clearedValues[0]).toBe('');
    expect(result.clearedValues[10]).toBe('');
    expect(result.clearedValues[1]).toBe(solution[1]);
  });

  it('marks the puzzle complete when every digit is correct', () => {
    const solution = NUMBER_PUZZLE.solutionRows.join('').split('');

    expect(checkNumberPuzzle(solution)).toMatchObject({
      complete: true
    });
  });
});
