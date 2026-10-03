import { useEffect, useReducer } from 'react'
import { Button } from '@/components/ui/button'
import {
  createInitialState,
  hasMemory,
  reduceCalculator,
  type CalculatorAction,
  type Operator,
} from '@/lib/calculator'
import { cn } from '@/lib/utils'

type KeyDef = {
  label: string
  action: CalculatorAction
  ariaLabel?: string
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  className?: string
}

const MEMORY_KEYS: KeyDef[] = [
  { label: 'MC', action: { type: 'memoryClear' }, variant: 'ghost' },
  { label: 'MR', action: { type: 'memoryRecall' }, variant: 'ghost' },
  { label: 'M+', action: { type: 'memoryAdd' }, variant: 'ghost' },
  { label: 'M−', action: { type: 'memorySubtract' }, variant: 'ghost' },
  { label: 'MS', action: { type: 'memoryStore' }, variant: 'ghost' },
]

const PAD_KEYS: KeyDef[] = [
  { label: '%', action: { type: 'percent' }, variant: 'secondary' },
  { label: 'CE', action: { type: 'clearEntry' }, variant: 'secondary' },
  { label: 'C', action: { type: 'clear' }, variant: 'secondary' },
  {
    label: '⌫',
    action: { type: 'backspace' },
    ariaLabel: 'Backspace',
    variant: 'secondary',
  },
  { label: '1/x', action: { type: 'reciprocal' }, variant: 'secondary' },
  { label: 'x²', action: { type: 'square' }, variant: 'secondary' },
  { label: '√x', action: { type: 'sqrt' }, variant: 'secondary' },
  {
    label: '÷',
    action: { type: 'operator', operator: '÷' },
    variant: 'secondary',
  },
  { label: '7', action: { type: 'digit', digit: '7' }, variant: 'outline' },
  { label: '8', action: { type: 'digit', digit: '8' }, variant: 'outline' },
  { label: '9', action: { type: 'digit', digit: '9' }, variant: 'outline' },
  {
    label: '×',
    action: { type: 'operator', operator: '×' },
    variant: 'secondary',
  },
  { label: '4', action: { type: 'digit', digit: '4' }, variant: 'outline' },
  { label: '5', action: { type: 'digit', digit: '5' }, variant: 'outline' },
  { label: '6', action: { type: 'digit', digit: '6' }, variant: 'outline' },
  {
    label: '−',
    action: { type: 'operator', operator: '-' },
    variant: 'secondary',
  },
  { label: '1', action: { type: 'digit', digit: '1' }, variant: 'outline' },
  { label: '2', action: { type: 'digit', digit: '2' }, variant: 'outline' },
  { label: '3', action: { type: 'digit', digit: '3' }, variant: 'outline' },
  {
    label: '+',
    action: { type: 'operator', operator: '+' },
    variant: 'secondary',
  },
  { label: '±', action: { type: 'negate' }, variant: 'outline' },
  { label: '0', action: { type: 'digit', digit: '0' }, variant: 'outline' },
  { label: '.', action: { type: 'decimal' }, variant: 'outline' },
  { label: '=', action: { type: 'equals' }, variant: 'default' },
]

function operatorFromKey(key: string): Operator | null {
  if (key === '+') return '+'
  if (key === '-') return '-'
  if (key === '*' || key === 'x' || key === 'X') return '×'
  if (key === '/') return '÷'
  return null
}

export function Calculator() {
  const [state, dispatch] = useReducer(reduceCalculator, undefined, createInitialState)
  const memoryActive = hasMemory(state)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      if (/^\d$/.test(event.key)) {
        event.preventDefault()
        dispatch({ type: 'digit', digit: event.key })
        return
      }

      if (event.key === '.' || event.key === ',') {
        event.preventDefault()
        dispatch({ type: 'decimal' })
        return
      }

      const op = operatorFromKey(event.key)
      if (op) {
        event.preventDefault()
        dispatch({ type: 'operator', operator: op })
        return
      }

      if (event.key === 'Enter' || event.key === '=') {
        event.preventDefault()
        dispatch({ type: 'equals' })
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        dispatch({ type: 'clear' })
        return
      }

      if (event.key === 'Backspace') {
        event.preventDefault()
        dispatch({ type: 'backspace' })
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <main className="flex min-h-[calc(100svh-3.25rem)] flex-col items-center justify-center p-6">
      <section
        className="w-full max-w-sm rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm"
        aria-label="Calculator"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 text-right">
            <div
              className="min-h-5 truncate text-xs text-muted-foreground"
              aria-live="polite"
            >
              {state.expression || '\u00a0'}
            </div>
            <div
              className={cn(
                'truncate text-4xl font-semibold tracking-tight',
                state.error && 'text-destructive',
              )}
              aria-live="polite"
              data-testid="calculator-display"
            >
              {state.display}
            </div>
          </div>
          <span
            className={cn(
              'mt-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              memoryActive
                ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground/50',
            )}
            aria-label={memoryActive ? 'Memory has a value' : 'Memory empty'}
          >
            M
          </span>
        </div>

        <div className="mb-2 grid grid-cols-5 gap-1.5">
          {MEMORY_KEYS.map((key) => (
            <Button
              key={key.label}
              type="button"
              variant={key.variant}
              className={cn(
                'h-9 text-xs',
                key.label === 'MC' && !memoryActive && 'opacity-40',
              )}
              disabled={key.label === 'MC' && !memoryActive}
              aria-label={key.ariaLabel ?? key.label}
              onClick={() => dispatch(key.action)}
            >
              {key.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {PAD_KEYS.map((key) => (
            <Button
              key={key.label}
              type="button"
              variant={key.variant}
              className={cn('h-12 text-base', key.className)}
              aria-label={key.ariaLabel ?? key.label}
              onClick={() => dispatch(key.action)}
            >
              {key.label}
            </Button>
          ))}
        </div>
      </section>
    </main>
  )
}
