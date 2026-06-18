export function calculateNextState(state, key) {
  let expression = state.expression;
  let display = state.display;

  if (key === 'clear') {
    expression = '';
    display = '0';
  } else if (key === 'back') {
    expression = expression.slice(0, -1);
    display = formatCalculatorDisplay(expression || '0');
  } else if (key === '=') {
    ({ expression, display } = evaluateCalculatorExpression(expression));
  } else {
    expression += key === ',' ? '.' : key === 'pi' ? 'π' : key;
    display = formatCalculatorDisplay(expression);
  }

  return { expression, display };
}

export function evaluateCalculatorExpression(expression) {
  const calculable = expression.replace(/,/g, '.').replace(/π/g, String(Math.PI));
  if (!/^[\d+\-*/().\s]+$/.test(calculable)) {
    return { expression: '', display: 'Fout' };
  }

  try {
    const result = Function(`"use strict"; return (${calculable})`)();
    if (!Number.isFinite(result)) throw new Error('Invalid calculator result');
    const expressionResult = String(Number(result.toFixed(10)));
    return {
      expression: expressionResult,
      display: formatCalculatorDisplay(expressionResult)
    };
  } catch {
    return { expression: '', display: 'Fout' };
  }
}

export function formatCalculatorDisplay(value) {
  return String(value)
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/\./g, ',');
}
