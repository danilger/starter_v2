import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type Operator = '+' | '-' | '*' | '/'

function formatDisplay(value: number): string {
  if (!Number.isFinite(value)) return 'Error'
  const text = String(value)
  if (text.length > 16) {
    return value.toPrecision(12).replace(/\.?0+$/, '')
  }
  return text
}

function compute(left: number, operator: Operator, right: number): number {
  switch (operator) {
    case '+':
      return left + right
    case '-':
      return left - right
    case '*':
      return left * right
    case '/':
      return right === 0 ? Number.NaN : left / right
  }
}

export function Calculator() {
  const [display, setDisplay] = useState('0')
  const [stored, setStored] = useState<number | null>(null)
  const [operator, setOperator] = useState<Operator | null>(null)
  const [overwrite, setOverwrite] = useState(true)

  function clearAll() {
    setDisplay('0')
    setStored(null)
    setOperator(null)
    setOverwrite(true)
  }

  function inputDigit(digit: string) {
    setDisplay((current) => {
      if (overwrite || current === 'Error') return digit
      if (current === '0') return digit
      if (current.length >= 16) return current
      return current + digit
    })
    setOverwrite(false)
  }

  function inputDecimal() {
    setDisplay((current) => {
      if (overwrite || current === 'Error') return '0.'
      if (current.includes('.')) return current
      return `${current}.`
    })
    setOverwrite(false)
  }

  function backspace() {
    if (overwrite || display === 'Error') {
      clearAll()
      return
    }
    setDisplay((current) => {
      if (current.length <= 1) return '0'
      return current.slice(0, -1)
    })
  }

  function applyOperator(next: Operator) {
    const current = Number(display)
    if (display === 'Error' || Number.isNaN(current)) {
      clearAll()
      return
    }

    if (stored !== null && operator !== null && !overwrite) {
      const result = compute(stored, operator, current)
      const formatted = formatDisplay(result)
      setDisplay(formatted)
      setStored(formatted === 'Error' ? null : result)
      setOperator(formatted === 'Error' ? null : next)
      setOverwrite(true)
      return
    }

    setStored(current)
    setOperator(next)
    setOverwrite(true)
  }

  function equals() {
    if (stored === null || operator === null || display === 'Error') return
    const current = Number(display)
    if (Number.isNaN(current)) {
      clearAll()
      return
    }
    const result = compute(stored, operator, current)
    setDisplay(formatDisplay(result))
    setStored(null)
    setOperator(null)
    setOverwrite(true)
  }

  function handleDisplayChange(value: string) {
    const sanitized = value.replace(/[^\d.]/g, '')
    if (sanitized === '' || sanitized === '.') {
      setDisplay(sanitized === '.' ? '0.' : '0')
      setOverwrite(sanitized === '')
      return
    }
    const parts = sanitized.split('.')
    const next =
      parts.length > 2
        ? `${parts[0]}.${parts.slice(1).join('')}`
        : sanitized
    setDisplay(next.slice(0, 16))
    setOverwrite(false)
  }

  const keys: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
    className?: string
    ariaLabel?: string
  }> = [
    { label: 'C', onClick: clearAll, variant: 'secondary', ariaLabel: 'Clear' },
    {
      label: '⌫',
      onClick: backspace,
      variant: 'secondary',
      ariaLabel: 'Backspace',
    },
    {
      label: '÷',
      onClick: () => applyOperator('/'),
      variant: 'outline',
      ariaLabel: 'Divide',
    },
    {
      label: '×',
      onClick: () => applyOperator('*'),
      variant: 'outline',
      ariaLabel: 'Multiply',
    },
    { label: '7', onClick: () => inputDigit('7') },
    { label: '8', onClick: () => inputDigit('8') },
    { label: '9', onClick: () => inputDigit('9') },
    {
      label: '−',
      onClick: () => applyOperator('-'),
      variant: 'outline',
      ariaLabel: 'Subtract',
    },
    { label: '4', onClick: () => inputDigit('4') },
    { label: '5', onClick: () => inputDigit('5') },
    { label: '6', onClick: () => inputDigit('6') },
    {
      label: '+',
      onClick: () => applyOperator('+'),
      variant: 'outline',
      ariaLabel: 'Add',
    },
    { label: '1', onClick: () => inputDigit('1') },
    { label: '2', onClick: () => inputDigit('2') },
    { label: '3', onClick: () => inputDigit('3') },
    {
      label: '=',
      onClick: equals,
      className: 'row-span-2 h-auto',
      ariaLabel: 'Equals',
    },
    {
      label: '0',
      onClick: () => inputDigit('0'),
      className: 'col-span-2',
    },
    {
      label: '.',
      onClick: inputDecimal,
      ariaLabel: 'Decimal point',
    },
  ]

  const expression =
    stored !== null && operator !== null
      ? `${formatDisplay(stored)} ${operator === '*' ? '×' : operator === '/' ? '÷' : operator}`
      : null

  return (
    <main className="flex min-h-[calc(100svh-3.25rem)] flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-sm text-left">
        <CardHeader>
          <CardTitle>Calculator</CardTitle>
          <CardDescription>
            Keyboard and input field with +, −, ×, ÷.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {expression ? (
            <p
              className="truncate text-right text-xs text-muted-foreground"
              aria-live="polite"
            >
              {expression}
            </p>
          ) : (
            <p className="h-4 text-right text-xs text-transparent">.</p>
          )}
          <Input
            value={display}
            onChange={(event) => handleDisplayChange(event.target.value)}
            inputMode="decimal"
            aria-label="Calculator display"
            className="h-12 text-right text-2xl font-medium tabular-nums md:text-2xl"
          />
          <div
            className="grid grid-cols-4 gap-2"
            role="group"
            aria-label="Calculator keyboard"
          >
            {keys.map((key) => (
              <Button
                key={key.ariaLabel ?? key.label}
                type="button"
                variant={key.variant ?? 'default'}
                size="lg"
                className={key.className}
                onClick={key.onClick}
                aria-label={key.ariaLabel}
              >
                {key.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
