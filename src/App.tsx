import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function App() {
  const [name, setName] = useState('')
  const [count, setCount] = useState(0)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-sm text-left">
        <CardHeader>
          <CardTitle>shadcn/ui</CardTitle>
          <CardDescription>
            Button, Card, and Input wired up for Vite + React + TypeScript.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label="Your name"
          />
          <p className="text-sm text-muted-foreground">
            {name ? `Hello, ${name}.` : 'Enter a name to preview Input.'}
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button type="button" onClick={() => setCount((value) => value + 1)}>
            Count is {count}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCount(0)
              setName('')
            }}
          >
            Reset
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}

export default App
