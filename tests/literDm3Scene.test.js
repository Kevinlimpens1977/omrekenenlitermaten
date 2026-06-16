import { describe, expect, it } from 'vitest';
import {
  getCupWorldPositionFromPointer,
  getLiterDm3State,
  isCupAboveCube
} from '../src/literDm3Scene.js';

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
      streamVisible: false,
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

  it('shows the water stream only while there is water to pour', () => {
    expect(getLiterDm3State(0, true).streamVisible).toBe(false);
    expect(getLiterDm3State(0.5, true).streamVisible).toBe(true);
    expect(getLiterDm3State(0.5, false).streamVisible).toBe(false);
    expect(getLiterDm3State(1, true).streamVisible).toBe(false);
  });

  it('maps board pointer movement to a bounded 3D cup position', () => {
    const bounds = { left: 10, top: 20, width: 200, height: 100 };

    expect(getCupWorldPositionFromPointer({ clientX: 10, clientY: 120 }, bounds)).toEqual({
      x: -2.15,
      y: 0.5,
      z: 0
    });

    expect(getCupWorldPositionFromPointer({ clientX: 210, clientY: 20 }, bounds)).toEqual({
      x: 2.15,
      y: 2.25,
      z: 0
    });
  });

  it('detects when the cup is above the cube opening', () => {
    expect(isCupAboveCube({ x: 0.48, y: 1.58 })).toBe(true);
    expect(isCupAboveCube({ x: 1.2, y: 1.58 })).toBe(false);
    expect(isCupAboveCube({ x: 0.48, y: 0.8 })).toBe(false);
  });
});
