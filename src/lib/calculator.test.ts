import { describe, expect, it } from 'vitest'
import {
  createInitialState,
  hasMemory,
  reduceCalculator,
  runActions,
  type CalculatorAction,
} from './calculator'

function digits(n: string): CalculatorAction[] {
  return n.split('').map((digit) =>
    digit === '.'
      ? ({ type: 'decimal' } as const)
      : ({ type: 'digit', digit } as const),
  )
}

describe('calculator engine', () => {
  it('adds two numbers', () => {
    const state = runActions([
      ...digits('2'),
      { type: 'operator', operator: '+' },
      ...digits('3'),
      { type: 'equals' },
    ])
    expect(state.display).toBe('5')
    expect(state.error).toBeNull()
  })

  it('evaluates chained ops left-to-right (not precedence)', () => {
    const state = runActions([
      ...digits('2'),
      { type: 'operator', operator: '+' },
      ...digits('3'),
      { type: 'operator', operator: '×' },
      ...digits('4'),
      { type: 'equals' },
    ])
    expect(state.display).toBe('20')
  })

  it('shows error on divide by zero', () => {
    const state = runActions([
      ...digits('1'),
      { type: 'operator', operator: '÷' },
      ...digits('0'),
      { type: 'equals' },
    ])
    expect(state.error).toBeTruthy()
    expect(state.display).toMatch(/divide/i)
  })

  it('CE clears entry only, keeping pending expression', () => {
    let state = runActions([
      ...digits('12'),
      { type: 'operator', operator: '+' },
      ...digits('34'),
    ])
    expect(state.expression).toContain('+')
    state = reduceCalculator(state, { type: 'clearEntry' })
    expect(state.display).toBe('0')
    expect(state.expression).toContain('12')
    expect(state.pendingOperator).toBe('+')
  })

  it('C clears everything except memory', () => {
    let state = runActions([
      ...digits('8'),
      { type: 'memoryStore' },
      ...digits('12'),
      { type: 'operator', operator: '+' },
      ...digits('3'),
    ])
    state = reduceCalculator(state, { type: 'clear' })
    expect(state.display).toBe('0')
    expect(state.expression).toBe('')
    expect(state.pendingOperator).toBeNull()
    expect(state.error).toBeNull()
    expect(state.memory).toBe(8)
  })

  it('backspace edits digits', () => {
    const state = runActions([...digits('123'), { type: 'backspace' }])
    expect(state.display).toBe('12')
  })

  it('negate toggles sign', () => {
    const state = runActions([...digits('5'), { type: 'negate' }])
    expect(state.display).toBe('-5')
  })

  it('squares the current value', () => {
    const state = runActions([...digits('4'), { type: 'square' }])
    expect(state.display).toBe('16')
  })

  it('errors on square root of negative', () => {
    const state = runActions([
      ...digits('5'),
      { type: 'negate' },
      { type: 'sqrt' },
    ])
    expect(state.error).toBeTruthy()
  })

  it('stores, recalls, and clears memory', () => {
    let state = runActions([...digits('8'), { type: 'memoryStore' }])
    expect(hasMemory(state)).toBe(true)
    state = reduceCalculator(state, { type: 'clear' })
    expect(state.display).toBe('0')
    state = reduceCalculator(state, { type: 'memoryRecall' })
    expect(state.display).toBe('8')
    state = reduceCalculator(state, { type: 'memoryClear' })
    expect(hasMemory(state)).toBe(false)
    state = reduceCalculator(state, { type: 'clear' })
    state = reduceCalculator(state, { type: 'memoryRecall' })
    expect(state.display).toBe('0')
  })

  it('updates expression when operator is chosen', () => {
    const state = runActions([...digits('12'), { type: 'operator', operator: '+' }])
    expect(state.expression).toBe('12 +')
    expect(state.display).toBe('12')
  })

  it('starts from initial zero', () => {
    expect(createInitialState().display).toBe('0')
  })
})
