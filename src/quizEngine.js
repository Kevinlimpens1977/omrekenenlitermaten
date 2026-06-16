const UNIT_FACTORS = {
  L: 1000,
  dL: 100,
  cL: 10,
  mL: 1,
  cm3: 1,
  dm3: 1000
};

export function convertVolume(value, fromUnit, toUnit) {
  const from = UNIT_FACTORS[fromUnit];
  const to = UNIT_FACTORS[toUnit];

  if (!Number.isFinite(Number(value)) || !from || !to) {
    throw new Error(`Cannot convert ${value} from ${fromUnit} to ${toUnit}`);
  }

  const raw = (Number(value) * from) / to;
  return Number(raw.toFixed(6));
}

export function parseAnswer(input) {
  const normalized = String(input)
    .trim()
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  return Number.parseFloat(normalized);
}

export function checkAnswer(input, expected) {
  const parsed = parseAnswer(input);
  if (!Number.isFinite(parsed)) return false;

  return Math.abs(parsed - expected) < 0.01;
}

export function createPracticeState(total = 20) {
  return {
    total,
    current: 0,
    correct: 0,
    wrong: 0,
    shouldRestart: false,
    readyForFinal: false
  };
}

export function resolvePracticeAnswer(state, isCorrect) {
  const current = Math.min(state.current + 1, state.total);
  const correct = state.correct + (isCorrect ? 1 : 0);
  const wrong = state.wrong + (isCorrect ? 0 : 1);
  const shouldRestart = wrong > 10;
  const readyForFinal = current >= state.total && wrong < 10;

  return {
    ...state,
    current,
    correct,
    wrong,
    shouldRestart,
    readyForFinal
  };
}

export function createFinalState() {
  return {
    current: 0,
    correct: 0,
    wrong: 0,
    correctStreak: 0,
    won: false
  };
}

export function resolveFinalAnswer(state, isCorrect) {
  const correctStreak = isCorrect ? state.correctStreak + 1 : 0;

  return {
    ...state,
    current: state.current + 1,
    correct: state.correct + (isCorrect ? 1 : 0),
    wrong: state.wrong + (isCorrect ? 0 : 1),
    correctStreak,
    won: correctStreak >= 10
  };
}

export const QUESTION_BANK = [
  { value: 4.2, from: 'L', to: 'mL' },
  { value: 750, from: 'mL', to: 'dL' },
  { value: 360, from: 'cm3', to: 'dL' },
  { value: 5.6, from: 'dL', to: 'mL' },
  { value: 430, from: 'mL', to: 'cL' },
  { value: 7.5, from: 'L', to: 'dL' },
  { value: 900, from: 'cm3', to: 'mL' },
  { value: 1200, from: 'cm3', to: 'L' },
  { value: 2.5, from: 'dm3', to: 'cL' },
  { value: 260, from: 'cm3', to: 'cL' },
  { value: 3.5, from: 'L', to: 'cL' },
  { value: 0.8, from: 'L', to: 'mL' },
  { value: 62, from: 'cL', to: 'mL' },
  { value: 1800, from: 'mL', to: 'L' },
  { value: 14, from: 'dL', to: 'L' },
  { value: 6, from: 'dm3', to: 'mL' },
  { value: 75, from: 'cL', to: 'dL' },
  { value: 1.25, from: 'L', to: 'mL' },
  { value: 340, from: 'mL', to: 'cL' },
  { value: 0.45, from: 'L', to: 'cL' }
];

export function makeQuestion(seedIndex, options = {}) {
  const bank = options.bank ?? QUESTION_BANK;
  const item = bank[seedIndex % bank.length];
  const answer = convertVolume(item.value, item.from, item.to);

  return {
    ...item,
    answer,
    prompt: `${formatNumber(item.value)} ${item.from} = ... ${item.to}`
  };
}

export function makeQuestionSet(count, offset = 0) {
  return Array.from({ length: count }, (_, index) => makeQuestion(index + offset));
}

export function formatNumber(value) {
  return Number(value).toLocaleString('nl-NL', {
    maximumFractionDigits: 2
  });
}
