export const NUMBER_PUZZLE = {
  rows: 7,
  cols: 8,
  solutionRows: ['225#9811', '8#110##3', '28#0#622', '#10000##', '2##0###9', '8#304##6', '826#9951'],
  starts: {
    0: 'a',
    2: 'b',
    4: 'c',
    7: 'd',
    10: 'e',
    11: 'f',
    16: 'g',
    17: 'h',
    21: 'i',
    25: 'j',
    32: 'k',
    39: 'l',
    42: 'm',
    44: 'n',
    48: 'o',
    53: 'p'
  },
  horizontal: [
    ['a', 'kwadraat van 15', '225'],
    ['c', '9<sup>2</sup> + 30<sup>2</sup>', '981'],
    ['e', '10<sup>2</sup> + 10', '110'],
    ['g', '5<sup>2</sup> + 3', '28'],
    ['i', '3<sup>2</sup> x 3 + 7 x 5', '62'],
    ['j', '100<sup>2</sup>', '10000'],
    ['m', '8<sup>2</sup> + 16<sup>2</sup> - 4<sup>2</sup>', '304'],
    ['o', '27<sup>2</sup> + 101 - 2<sup>2</sup>', '826'],
    ['p', '32<sup>2</sup> - (8<sup>2</sup> + 9)', '951']
  ],
  vertical: [
    ['a', '16<sup>2</sup> + 25 + 1<sup>2</sup>', '282'],
    ['b', '7<sup>2</sup> + 2', '51'],
    ['c', '9<sup>2</sup> + 3<sup>2</sup>', '90'],
    ['d', '125 + 7', '132'],
    ['f', '10<sup>2</sup> x 10<sup>2</sup>', '10000'],
    ['h', 'negen kwadraat', '81'],
    ['i', '8<sup>2</sup> - 2<sup>2</sup>', '60'],
    ['k', '(13 - 1)<sup>2</sup> + 144', '288'],
    ['l', '31<sup>2</sup>', '961'],
    ['m', 'kwadraat van 6', '36'],
    ['n', 'kwadraat van zeven', '49']
  ]
};

export function checkNumberPuzzle(values, puzzle = NUMBER_PUZZLE) {
  const solution = puzzle.solutionRows.flatMap((row) => row.split(''));
  const checked = solution.map((digit, index) => digit === '#' || String(values[index] ?? '').trim() === digit);
  const complete = checked.every(Boolean);

  return {
    complete,
    checked,
    clearedValues: solution.map((digit, index) => {
      if (digit === '#') return '';
      return checked[index] ? digit : '';
    })
  };
}
