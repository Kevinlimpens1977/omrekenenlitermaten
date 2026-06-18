import { describe, expect, it } from 'vitest';
import { checkNumberPuzzle, NUMBER_PUZZLE } from '../src/numberPuzzle.js';

describe('number puzzle', () => {
  it('uses the exact letters and layout from the example puzzle', () => {
    expect(NUMBER_PUZZLE.rows).toBe(7);
    expect(NUMBER_PUZZLE.cols).toBe(8);
    expect(NUMBER_PUZZLE.solutionRows).toEqual([
      '225#9811',
      '8#110##3',
      '28#0#622',
      '#10000##',
      '2##0###9',
      '8#304##6',
      '826#9951'
    ]);
    expect(NUMBER_PUZZLE.horizontal.map(([letter]) => letter)).toEqual(['a', 'c', 'e', 'g', 'i', 'j', 'm', 'o', 'p']);
    expect(NUMBER_PUZZLE.vertical.map(([letter]) => letter)).toEqual(['a', 'b', 'c', 'd', 'f', 'h', 'i', 'k', 'l', 'm', 'n']);
  });

  it('uses the exact example sums', () => {
    expect(NUMBER_PUZZLE.horizontal.map(([letter, clue]) => [letter, clue])).toEqual([
      ['a', 'kwadraat van 15'],
      ['c', '9<sup>2</sup> + 30<sup>2</sup>'],
      ['e', '10<sup>2</sup> + 10'],
      ['g', '5<sup>2</sup> + 3'],
      ['i', '3<sup>2</sup> x 3 + 7 x 5'],
      ['j', '100<sup>2</sup>'],
      ['m', '8<sup>2</sup> + 16<sup>2</sup> - 4<sup>2</sup>'],
      ['o', '27<sup>2</sup> + 101 - 2<sup>2</sup>'],
      ['p', '32<sup>2</sup> - (8<sup>2</sup> + 9)']
    ]);
    expect(NUMBER_PUZZLE.vertical.map(([letter, clue]) => [letter, clue])).toEqual([
      ['a', '16<sup>2</sup> + 25 + 1<sup>2</sup>'],
      ['b', '7<sup>2</sup> + 2'],
      ['c', '9<sup>2</sup> + 3<sup>2</sup>'],
      ['d', '125 + 7'],
      ['f', '10<sup>2</sup> x 10<sup>2</sup>'],
      ['h', 'negen kwadraat'],
      ['i', '8<sup>2</sup> - 2<sup>2</sup>'],
      ['k', '(13 - 1)<sup>2</sup> + 144'],
      ['l', '31<sup>2</sup>'],
      ['m', 'kwadraat van 6'],
      ['n', 'kwadraat van zeven']
    ]);
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
