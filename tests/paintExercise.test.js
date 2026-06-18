import { describe, expect, it } from 'vitest';
import {
  checkPaintExercise,
  PAINT_EXERCISE,
  scratchpadHasCalculation
} from '../src/paintExercise.js';

describe('paint exercise', () => {
  it('extracts the final paint question and expected answer from the source text', () => {
    expect(PAINT_EXERCISE.question).toBe('een verfflik heeft een diameter van 12 cm en een hoogte van 20 cm. Laat zien of er 2L verf in past.');
    expect(PAINT_EXERCISE.expected).toEqual({
      fitsTwoLiters: true,
      volumeCm3: 2261.9,
      volumeLiters: 2.26
    });
  });

  it('requires a visible calculation on the scratchpad before checking the answer', () => {
    const result = checkPaintExercise({
      answer: 'Ja, 2 liter past want de inhoud is 2262 cm3.',
      scratchpad: ''
    });

    expect(result).toEqual({
      status: 'missing-work',
      message: 'Ik zie geen berekening, pas dat aan'
    });
  });

  it('recognizes calculation-like scratchpad work', () => {
    expect(scratchpadHasCalculation('pi x 6 x 6 x 20 = 2262 cm3 = 2,26 L')).toBe(true);
    expect(scratchpadHasCalculation('diameter 12 dus straal 6, hoogte 20')).toBe(true);
    expect(scratchpadHasCalculation('ik heb het uitgerekend')).toBe(false);
  });

  it('marks the answer correct when it says 2 liters fits and gives enough volume', () => {
    const result = checkPaintExercise({
      answer: 'Ja, er past 2 liter in. De inhoud is ongeveer 2262 cm3 = 2,26 liter.',
      scratchpad: 'pi * 6 * 6 * 20 = 2261,9 cm3, dus 2,26 L.'
    });

    expect(result).toEqual({
      status: 'correct',
      message: 'Goed.'
    });
  });

  it('marks answers wrong when the conclusion or volume support is missing', () => {
    const result = checkPaintExercise({
      answer: 'Nee, 2 liter past niet.',
      scratchpad: 'pi * 6 * 6 * 20 = 2261,9 cm3'
    });

    expect(result.status).toBe('wrong');
  });
});
