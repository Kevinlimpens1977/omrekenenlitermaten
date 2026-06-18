import { describe, expect, it } from 'vitest';
import {
  checkCircleExercise,
  CIRCLE_EXERCISE,
  hasAllCircleInputsFilled,
  normalizeDecimalInput
} from '../src/circleExercise.js';

describe('circle table exercise', () => {
  it('contains the given values and the open table fields from the attachment', () => {
    expect(CIRCLE_EXERCISE.rows.map((row) => row.label)).toEqual([
      'straal in cm',
      'diameter in cm',
      'omtrek in cm',
      'oppervlakte in cm2'
    ]);
    expect(CIRCLE_EXERCISE.given).toEqual({
      'radius-A': '3,6',
      'diameter-B': '27',
      'circumference-C': '153,94'
    });
    expect(CIRCLE_EXERCISE.answers).toMatchObject({
      'diameter-A': 7.2,
      'circumference-A': 22.6,
      'area-A': 40.7,
      'radius-B': 13.5,
      'circumference-B': 84.8,
      'area-B': 572.6,
      'radius-C': 24.5,
      'diameter-C': 49,
      'area-C': 1885.8
    });
  });

  it('normalizes spaces, decimal commas and decimal points as the same input style', () => {
    expect(normalizeDecimalInput(' 22,6 ')).toBe(22.6);
    expect(normalizeDecimalInput(' 22.6 ')).toBe(22.6);
    expect(normalizeDecimalInput('abc')).toBe(null);
  });

  it('does not allow checking until every open table field is filled', () => {
    const values = Object.fromEntries(Object.keys(CIRCLE_EXERCISE.answers).map((key) => [key, '1']));
    values['area-C'] = ' ';

    expect(hasAllCircleInputsFilled(values)).toBe(false);
    expect(hasAllCircleInputsFilled({ ...values, 'area-C': '1885,8' })).toBe(true);
  });

  it('checks only the open answer fields and reports whether all answers are correct', () => {
    const values = {
      'diameter-A': '7,2',
      'circumference-A': '22.6',
      'area-A': '40,7',
      'radius-B': '13,5',
      'circumference-B': '84,8',
      'area-B': '572,6',
      'radius-C': '24,5',
      'diameter-C': '49,0',
      'area-C': '1885,8'
    };

    const result = checkCircleExercise(values);

    expect(result.complete).toBe(true);
    expect(result.allCorrect).toBe(true);
    expect(result.fields['circumference-A']).toMatchObject({ status: 'correct' });
    expect(result.fields['area-C']).toMatchObject({ status: 'correct' });
  });

  it('marks wrong answers and identifies answers that are calculated but not rounded to one decimal', () => {
    const values = {
      'diameter-A': '7,2',
      'circumference-A': '22,62',
      'area-A': '999',
      'radius-B': '13,5',
      'circumference-B': '84,82',
      'area-B': '572,6',
      'radius-C': '24,5',
      'diameter-C': '49',
      'area-C': '1885,79'
    };

    const result = checkCircleExercise(values);

    expect(result.complete).toBe(true);
    expect(result.allCorrect).toBe(false);
    expect(result.fields['circumference-A']).toMatchObject({ status: 'rounding' });
    expect(result.fields['circumference-B']).toMatchObject({ status: 'rounding' });
    expect(result.fields['area-C']).toMatchObject({ status: 'rounding' });
    expect(result.fields['area-A']).toMatchObject({ status: 'wrong' });
  });
});
