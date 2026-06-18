import { describe, expect, it } from 'vitest';
import { calculateNextState } from '../src/calculator.js';

describe('calculator', () => {
  it('uses a pi button in circle calculations', () => {
    let state = { expression: '', display: '0' };
    for (const key of ['2', '*', 'pi', '*', '3', ',', '6', '=']) {
      state = calculateNextState(state, key);
    }

    expect(Number(state.expression)).toBeCloseTo(22.619467, 5);
    expect(state.display).toBe('22,6194671058');
  });
});
