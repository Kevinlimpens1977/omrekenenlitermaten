import { describe, expect, it } from 'vitest';
import { getLiterDm3State } from '../src/literDm3Scene.js';

describe('liter dm3 scene state', () => {
  it('links cup and cube water levels to one pourProgress value', () => {
    expect(getLiterDm3State(0)).toMatchObject({
      cupLevel: 1,
      cubeLevel: 0,
      streamVisible: false,
      equivalence: '0 L = 0 dm3'
    });

    expect(getLiterDm3State(0.5)).toMatchObject({
      cupLevel: 0.5,
      cubeLevel: 0.5,
      streamVisible: true,
      equivalence: '0,5 L = 0,5 dm3'
    });

    expect(getLiterDm3State(1)).toMatchObject({
      cupLevel: 0,
      cubeLevel: 1,
      streamVisible: false,
      equivalence: '1 L = 1 dm3'
    });
  });

  it('clamps progress so the visual volume never overflows', () => {
    expect(getLiterDm3State(-1).cubeLevel).toBe(0);
    expect(getLiterDm3State(2).cubeLevel).toBe(1);
  });
});
