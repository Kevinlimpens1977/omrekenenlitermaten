const CIRCLE_PI = Math.PI;
const CIRCLE_C_GIVEN = 153.94;

function roundOne(value) {
  return Number(value.toFixed(1));
}

function decimalPlaces(input) {
  const trimmed = String(input).trim();
  const match = trimmed.match(/[,.](\d+)/);
  if (!match) return 0;
  return match[1].replace(/0+$/, '').length;
}

export const CIRCLE_EXERCISE = {
  columns: ['A', 'B', 'C'],
  rows: [
    { key: 'radius', label: 'straal in cm' },
    { key: 'diameter', label: 'diameter in cm' },
    { key: 'circumference', label: 'omtrek in cm' },
    { key: 'area', label: 'oppervlakte in cm2' }
  ],
  given: {
    'radius-A': '3,6',
    'diameter-B': '27',
    'circumference-C': '153,94'
  },
  answers: {
    'diameter-A': 7.2,
    'circumference-A': roundOne(2 * CIRCLE_PI * 3.6),
    'area-A': roundOne(CIRCLE_PI * 3.6 * 3.6),
    'radius-B': 13.5,
    'circumference-B': roundOne(CIRCLE_PI * 27),
    'area-B': roundOne(CIRCLE_PI * 13.5 * 13.5),
    'radius-C': roundOne(CIRCLE_C_GIVEN / (2 * CIRCLE_PI)),
    'diameter-C': roundOne(CIRCLE_C_GIVEN / CIRCLE_PI),
    'area-C': roundOne((CIRCLE_C_GIVEN / (2 * CIRCLE_PI)) ** 2 * CIRCLE_PI)
  },
  rawAnswers: {
    'circumference-A': 2 * CIRCLE_PI * 3.6,
    'area-A': CIRCLE_PI * 3.6 * 3.6,
    'circumference-B': CIRCLE_PI * 27,
    'area-B': CIRCLE_PI * 13.5 * 13.5,
    'radius-C': CIRCLE_C_GIVEN / (2 * CIRCLE_PI),
    'diameter-C': CIRCLE_C_GIVEN / CIRCLE_PI,
    'area-C': (CIRCLE_C_GIVEN / (2 * CIRCLE_PI)) ** 2 * CIRCLE_PI
  }
};

export function normalizeDecimalInput(input) {
  const cleaned = String(input).trim().replace(',', '.');
  if (!cleaned) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function hasAllCircleInputsFilled(values, exercise = CIRCLE_EXERCISE) {
  return Object.keys(exercise.answers).every((key) => String(values[key] ?? '').trim() !== '');
}

export function checkCircleExercise(values, exercise = CIRCLE_EXERCISE) {
  const complete = hasAllCircleInputsFilled(values, exercise);
  const fields = {};

  for (const [key, expected] of Object.entries(exercise.answers)) {
    const input = values[key] ?? '';
    const parsed = normalizeDecimalInput(input);

    if (parsed === null) {
      fields[key] = { status: 'wrong', expected };
      continue;
    }

    const isCorrect = Math.abs(parsed - expected) < 0.000001;
    const isRoundedToExpected = Math.abs(roundOne(parsed) - expected) < 0.000001;
    const isRawCalculation = Math.abs(parsed - (exercise.rawAnswers[key] ?? expected)) < 0.02;
    const hasExtraDecimals = decimalPlaces(input) > 1;

    if (isCorrect) {
      fields[key] = { status: 'correct', expected };
    } else if ((isRoundedToExpected && hasExtraDecimals) || isRawCalculation) {
      fields[key] = { status: 'rounding', expected };
    } else {
      fields[key] = { status: 'wrong', expected };
    }
  }

  return {
    complete,
    allCorrect: complete && Object.values(fields).every((field) => field.status === 'correct'),
    fields
  };
}
