# Spec Delta

## Purpose

Provides a Standard Windows Calculator–style calculator in the web app: familiar key layout, arithmetic and unary operations, memory, and keyboard input for everyday calculations.

## ADDED Requirements

### Requirement: Calculator page is reachable
The system SHALL expose a dedicated calculator page reachable from the main navigation.

#### Scenario: Open calculator from nav
- **WHEN** the user selects the Calculator navigation item
- **THEN** the calculator page is displayed

### Requirement: Standard key layout
The calculator MUST present keys in a Standard Windows Calculator–like arrangement covering: memory keys MC, MR, M+, M−, MS; `%`; CE; C; Backspace; `1/x`; `x²`; `√x`; `÷`; digits `7` `8` `9`; `×`; digits `4` `5` `6`; `−`; digits `1` `2` `3`; `+`; `±`; `0`; `.`; `=`.

#### Scenario: All standard keys are present
- **WHEN** the calculator page is displayed
- **THEN** every key listed in this requirement is visible and operable

### Requirement: Display shows current value and expression
The calculator SHALL show the current entry or result on a primary display and SHALL show the pending expression (operand and operator) when an operator has been chosen.

#### Scenario: Operator updates expression line
- **WHEN** the user enters `12` then presses `+`
- **THEN** the expression line indicates `12 +` and the primary display remains ready for the next operand

### Requirement: Basic arithmetic
The calculator MUST compute addition, subtraction, multiplication, and division for chained binary operations and MUST evaluate when `=` is pressed.

#### Scenario: Simple addition
- **WHEN** the user enters `2`, `+`, `3`, then `=`
- **THEN** the primary display shows `5`

#### Scenario: Chained operations
- **WHEN** the user enters `2`, `+`, `3`, `×`, `4`, then `=`
- **THEN** the calculator evaluates left-to-right as Standard mode does (not algebraic precedence), yielding `20`

#### Scenario: Division by zero
- **WHEN** the user attempts to divide by zero
- **THEN** the calculator shows an error state and does not present a numeric result until cleared

### Requirement: Clear and edit keys
The calculator SHALL support CE (clear current entry), C (clear all), and Backspace (delete last digit of the current entry).

#### Scenario: CE clears entry only
- **WHEN** the user has a pending operator and a new entry, then presses CE
- **THEN** the current entry resets to `0` and the pending expression remains

#### Scenario: C clears everything
- **WHEN** the user presses C during a calculation
- **THEN** the entry, pending expression, and error state are cleared to the initial state

#### Scenario: Backspace edits digits
- **WHEN** the primary display shows `123` and the user presses Backspace
- **THEN** the primary display shows `12`

### Requirement: Unary operations
The calculator MUST support percent (`%`), reciprocal (`1/x`), square (`x²`), square root (`√x`), and negate (`±`) consistent with Standard Calculator behavior on the current value.

#### Scenario: Negate toggles sign
- **WHEN** the primary display shows `5` and the user presses `±`
- **THEN** the primary display shows `-5`

#### Scenario: Square of a number
- **WHEN** the primary display shows `4` and the user presses `x²`
- **THEN** the primary display shows `16`

#### Scenario: Square root of negative
- **WHEN** the primary display shows a negative number and the user presses `√x`
- **THEN** the calculator shows an error state until cleared

### Requirement: Memory operations
The calculator SHALL provide memory store (MS), recall (MR), clear (MC), add (M+), and subtract (M−), and SHALL indicate when memory holds a non-zero value.

#### Scenario: Store and recall
- **WHEN** the user stores `8` with MS, clears the display, then presses MR
- **THEN** the primary display shows `8`

#### Scenario: Memory clear
- **WHEN** memory holds a value and the user presses MC
- **THEN** memory is cleared and MR does not restore the previous value

### Requirement: Keyboard input
While the calculator page is focused, the system SHALL accept keyboard input for digits `0–9`, decimal separator, operators `+ − * /`, Enter or `=` for equals, Escape for C, and Backspace for digit delete.

#### Scenario: Keyboard equals
- **WHEN** the user types `7`, `+`, `1`, then presses Enter
- **THEN** the primary display shows `8`

#### Scenario: Escape clears
- **WHEN** a calculation is in progress and the user presses Escape
- **THEN** the calculator returns to the initial cleared state
