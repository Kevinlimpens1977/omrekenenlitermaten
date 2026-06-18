export const PAINT_EXERCISE = {
  sourceText:
    'een verfflik heeft een diameter van 12 cm en een hoogte van 20 cm. Laat zien of er 2L verf in past.',
  question:
    'een verfflik heeft een diameter van 12 cm en een hoogte van 20 cm. Laat zien of er 2L verf in past.',
  expected: {
    fitsTwoLiters: true,
    volumeCm3: 2261.9,
    volumeLiters: 2.26
  }
};

export function scratchpadHasCalculation(scratchpad) {
  const text = String(scratchpad).trim().toLowerCase();
  const numbers = text.match(/\d+(?:[,.]\d+)?/g) ?? [];
  const hasOperator = /[+\-*/:=x]/.test(text);
  const hasCircleClue = /\bpi\b|cm3|cm\^3|liter|diameter|straal|hoogte|12|20/.test(text);

  return numbers.length >= 2 && (hasOperator || hasCircleClue);
}

export function checkPaintExercise({ answer, scratchpad }) {
  if (!scratchpadHasCalculation(scratchpad)) {
    return {
      status: 'missing-work',
      message: 'Ik zie geen berekening, pas dat aan'
    };
  }

  const normalized = String(answer).toLowerCase().replace(',', '.');
  const saysFits = /\bja\b/.test(normalized) || /past/.test(normalized);
  const hasTwoLiterConclusion = /2\s*(l|liter)|twee\s*liter/.test(normalized);
  const hasEnoughVolume = /2[,.]?(?:2|26|261|262)|2261|2262|meer dan 2|groter dan 2/.test(normalized);

  if (saysFits && hasTwoLiterConclusion && hasEnoughVolume) {
    return {
      status: 'correct',
      message: 'Goed.'
    };
  }

  return {
    status: 'wrong',
    message: 'Nog niet goed. Controleer of je antwoord zegt dat 2 liter past, omdat de inhoud ongeveer 2262 cm3 is.'
  };
}
