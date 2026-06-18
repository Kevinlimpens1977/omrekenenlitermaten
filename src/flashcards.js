export const FLASHCARDS = [
  {
    front: 'Wat gebeurt er per stap naar rechts in het literschema?',
    back: 'Elke stap naar rechts is keer 10. Bijvoorbeeld: 1 L = 10 dL = 100 cL = 1000 mL.'
  },
  {
    front: 'Wat gebeurt er per stap naar links in het literschema?',
    back: 'Elke stap naar links is delen door 10. Bijvoorbeeld: 1000 mL = 100 cL = 10 dL = 1 L.'
  },
  {
    front: 'Wat betekent de d in dL?',
    back: 'deci. Dat betekent 1/10. Dus 1 dL = 0,1 L.'
  },
  {
    front: 'Wat betekent de c in cL?',
    back: 'centi. Dat betekent 1/100. Dus 1 cL = 0,01 L.'
  },
  {
    front: 'Wat betekent de m in mL?',
    back: 'milli. Dat betekent 1/1000. Dus 1 mL = 0,001 L.'
  },
  {
    front: 'Welke koppeling hoort bij 1 cm3?',
    back: '1 cm3 = 1 mL. Een kubieke centimeter is precies evenveel als een milliliter.'
  },
  {
    front: 'Welke koppeling hoort bij 1 dm3?',
    back: '1 dm3 = 1 L. Een kubus van 1 dm bij 1 dm bij 1 dm past precies 1 liter.'
  },
  {
    front: 'Hoe schrijf je 1200 cm3 om naar liter?',
    back: '1200 cm3 = 1200 mL = 1,2 L.'
  },
  {
    front: 'Hoe reken je 2,5 dm3 om naar cL?',
    back: '2,5 dm3 = 2,5 L. Van L naar cL is 2 stappen naar rechts, dus x 100. Antwoord: 250 cL.'
  },
  {
    front: 'Wat is de vaste volgorde in het literschema?',
    back: 'L, dL, cL, mL.'
  }
];

export function createFlashcardState() {
  return {
    index: 0,
    known: 0,
    practice: 0,
    flipped: false,
    completed: false
  };
}

export function getFlashcard(state, cards = FLASHCARDS) {
  return cards[state.index] ?? cards[cards.length - 1];
}

export function flipFlashcard(state) {
  return {
    ...state,
    flipped: !state.flipped
  };
}

export function resolveFlashcard(state, remembered, cards = FLASHCARDS) {
  const nextIndex = state.index + 1;
  return {
    ...state,
    index: Math.min(nextIndex, cards.length - 1),
    known: state.known + (remembered ? 1 : 0),
    practice: state.practice + (remembered ? 0 : 1),
    flipped: false,
    completed: nextIndex >= cards.length
  };
}
