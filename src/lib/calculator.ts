export type Operator = '+' | '-' | '×' | '÷'

export type CalculatorState = {
  display: string
  expression: string
  accumulator: number | null
  pendingOperator: Operator | null
  memory: number
  error: string | null
  overwrite: boolean
  lastOperand: number | null
  lastOperator: Operator | null
}

export type CalculatorAction =
  | { type: 'digit'; digit: string }
  | { type: 'decimal' }
  | { type: 'operator'; operator: Operator }
  | { type: 'equals' }
  | { type: 'clear' }
  | { type: 'clearEntry' }
  | { type: 'backspace' }
  | { type: 'negate' }
  | { type: 'percent' }
  | { type: 'reciprocal' }
  | { type: 'square' }
  | { type: 'sqrt' }
  | { type: 'memoryClear' }
  | { type: 'memoryRecall' }
  | { type: 'memoryAdd' }
  | { type: 'memorySubtract' }
  | { type: 'memoryStore' }

const ERROR_DIV_ZERO = 'Cannot divide by zero'
const ERROR_INVALID = 'Invalid input'

export function createInitialState(): CalculatorState {
  return {
    display: '0',
    expression: '',
    accumulator: null,
    pendingOperator: null,
    memory: 0,
    error: null,
    overwrite: true,
    lastOperand: null,
    lastOperator: null,
  }
}

export function hasMemory(state: CalculatorState): boolean {
  return state.memory !== 0
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return ERROR_INVALID
  }

  const abs = Math.abs(value)
  if (abs !== 0 && (abs >= 1e16 || abs < 1e-10)) {
    return value.toExponential(10).replace(/\.?0+e/, 'e')
  }

  let text = value.toPrecision(12)
  if (text.includes('e') || text.includes('E')) {
    return text.replace(/\.?0+e/i, (match) => match.replace(/0+/, '').replace(/\.$/, '') || 'e')
  }

  if (text.includes('.')) {
    text = text.replace(/\.?0+$/, '')
  }

  return text === '-0' ? '0' : text
}

function parseDisplay(display: string): number {
  return Number(display)
}

function applyBinary(left: number, operator: Operator, right: number): number | typeof ERROR_DIV_ZERO {
  switch (operator) {
    case '+':
      return left + right
    case '-':
      return left - right
    case '×':
      return left * right
    case '÷':
      if (right === 0) return ERROR_DIV_ZERO
      return left / right
  }
}

function withError(state: CalculatorState, message: string): CalculatorState {
  return {
    ...state,
    display: message,
    expression: '',
    error: message,
    overwrite: true,
    accumulator: null,
    pendingOperator: null,
    lastOperand: null,
    lastOperator: null,
  }
}

function setDisplayValue(state: CalculatorState, value: number, expression = state.expression): CalculatorState {
  const formatted = formatNumber(value)
  if (formatted === ERROR_INVALID || !Number.isFinite(value)) {
    return withError(state, ERROR_INVALID)
  }
  return {
    ...state,
    display: formatted,
    expression,
    error: null,
    overwrite: true,
  }
}

function recoverAllowed(action: CalculatorAction): boolean {
  return action.type === 'clear' || action.type === 'clearEntry'
}

export function reduceCalculator(
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState {
  if (state.error && !recoverAllowed(action)) {
    return state
  }

  switch (action.type) {
    case 'clear':
      return {
        ...createInitialState(),
        memory: state.memory,
      }

    case 'clearEntry':
      return {
        ...state,
        display: '0',
        error: null,
        overwrite: true,
      }

    case 'digit': {
      const digit = action.digit
      if (!/^\d$/.test(digit)) return state

      if (state.overwrite) {
        return {
          ...state,
          display: digit,
          overwrite: false,
          error: null,
        }
      }

      if (state.display === '0') {
        return { ...state, display: digit }
      }
      if (state.display === '-0') {
        return { ...state, display: `-${digit}` }
      }

      return { ...state, display: `${state.display}${digit}` }
    }

    case 'decimal': {
      if (state.overwrite) {
        return { ...state, display: '0.', overwrite: false, error: null }
      }
      if (state.display.includes('.')) return state
      return { ...state, display: `${state.display}.` }
    }

    case 'backspace': {
      if (state.overwrite || state.error) return state
      if (state.display.length <= 1 || state.display === '-0') {
        return { ...state, display: '0', overwrite: true }
      }
      if (state.display.length === 2 && state.display.startsWith('-')) {
        return { ...state, display: '0', overwrite: true }
      }
      const next = state.display.slice(0, -1)
      if (next === '-' || next === '') {
        return { ...state, display: '0', overwrite: true }
      }
      return { ...state, display: next }
    }

    case 'operator': {
      const current = parseDisplay(state.display)

      if (state.accumulator !== null && state.pendingOperator && !state.overwrite) {
        const result = applyBinary(state.accumulator, state.pendingOperator, current)
        if (result === ERROR_DIV_ZERO) return withError(state, ERROR_DIV_ZERO)
        return {
          ...state,
          display: formatNumber(result),
          expression: `${formatNumber(result)} ${action.operator}`,
          accumulator: result,
          pendingOperator: action.operator,
          overwrite: true,
          lastOperand: null,
          lastOperator: null,
          error: null,
        }
      }

      const base =
        state.accumulator !== null && state.overwrite && state.pendingOperator
          ? state.accumulator
          : current

      return {
        ...state,
        display: formatNumber(base),
        expression: `${formatNumber(base)} ${action.operator}`,
        accumulator: base,
        pendingOperator: action.operator,
        overwrite: true,
        lastOperand: null,
        lastOperator: null,
        error: null,
      }
    }

    case 'equals': {
      if (state.pendingOperator && state.accumulator !== null) {
        const right = state.overwrite && state.lastOperand !== null
          ? state.lastOperand
          : parseDisplay(state.display)
        const result = applyBinary(state.accumulator, state.pendingOperator, right)
        if (result === ERROR_DIV_ZERO) return withError(state, ERROR_DIV_ZERO)

        return {
          ...state,
          display: formatNumber(result),
          expression: '',
          accumulator: result,
          pendingOperator: null,
          overwrite: true,
          lastOperand: right,
          lastOperator: state.pendingOperator,
          error: null,
        }
      }

      if (state.lastOperator && state.lastOperand !== null) {
        const left = parseDisplay(state.display)
        const result = applyBinary(left, state.lastOperator, state.lastOperand)
        if (result === ERROR_DIV_ZERO) return withError(state, ERROR_DIV_ZERO)
        return {
          ...state,
          display: formatNumber(result),
          expression: '',
          accumulator: result,
          overwrite: true,
          error: null,
        }
      }

      return { ...state, expression: '', overwrite: true }
    }

    case 'negate': {
      if (state.display === '0' || state.display === '0.') {
        return state
      }
      if (state.display.startsWith('-')) {
        return { ...state, display: state.display.slice(1), overwrite: false }
      }
      return { ...state, display: `-${state.display}`, overwrite: false }
    }

    case 'percent': {
      const current = parseDisplay(state.display)
      let value: number
      if (state.accumulator !== null && state.pendingOperator) {
        if (state.pendingOperator === '+' || state.pendingOperator === '-') {
          value = (state.accumulator * current) / 100
        } else {
          value = current / 100
        }
      } else {
        value = current / 100
      }
      return setDisplayValue({ ...state, overwrite: true }, value)
    }

    case 'reciprocal': {
      const current = parseDisplay(state.display)
      if (current === 0) return withError(state, ERROR_DIV_ZERO)
      return setDisplayValue(state, 1 / current, '')
    }

    case 'square': {
      const current = parseDisplay(state.display)
      return setDisplayValue(state, current * current, '')
    }

    case 'sqrt': {
      const current = parseDisplay(state.display)
      if (current < 0) return withError(state, ERROR_INVALID)
      return setDisplayValue(state, Math.sqrt(current), '')
    }

    case 'memoryClear':
      return { ...state, memory: 0 }

    case 'memoryRecall':
      return {
        ...state,
        display: formatNumber(state.memory),
        overwrite: true,
        error: null,
      }

    case 'memoryStore':
      return { ...state, memory: parseDisplay(state.display) }

    case 'memoryAdd':
      return { ...state, memory: state.memory + parseDisplay(state.display) }

    case 'memorySubtract':
      return { ...state, memory: state.memory - parseDisplay(state.display) }

    default:
      return state
  }
}

/** Helper for tests and keyboard mapping: dispatch a sequence of actions. */
export function runActions(
  actions: CalculatorAction[],
  initial: CalculatorState = createInitialState(),
): CalculatorState {
  return actions.reduce(reduceCalculator, initial)
}
