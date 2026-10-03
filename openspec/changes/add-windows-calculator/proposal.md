# Proposal

## Why

Нужен веб-калькулятор с раскладкой и набором клавиш как у встроенного Windows Calculator (режим Standard), чтобы пользователь мог считать прямо в приложении `starter_v2` без сторонних инструментов. Сейчас в проекте есть только демо Home/About — отдельного калькулятора нет.

## What Changes

- Добавить страницу/маршрут калькулятора в React-приложении.
- Реализовать UI с раскладкой клавиш Standard Windows Calculator: память (MC/MR/M+/M−/MS), `%`, CE, C, Backspace, `1/x`, `x²`, `√x`, `÷`, `×`, `−`, `+`, `±`, цифры `0–9`, `.`, `=`.
- Реализовать арифметику и поведение операций в духе Standard Calculator (цепочки операций, повтор `=`, очистка CE/C, унарные функции).
- Поддержать ввод с клавиатуры для цифр, операторов, Enter/`=`, Escape/C, Backspace.
- Добавить пункт навигации к калькулятору.

## Capabilities

### New Capabilities
- `calculator`: стандартный калькулятор с Windows-подобной раскладкой, дисплеем, памятью и клавиатурным вводом

### Modified Capabilities

## Impact

- Код: `src/App.tsx` (маршрут и nav), новая страница/компоненты калькулятора под `src/pages` и/или `src/components`, возможно чистая логика в `src/lib`.
- UI-стек без новых обязательных зависимостей: React 19, Vite, Tailwind 4, существующие shadcn `Button` и утилиты.
- Поведение и визуал ориентированы на Standard Windows Calculator; pixel-perfect WinUI и режимы Scientific/Programmer/Graphing — вне скоупа.
