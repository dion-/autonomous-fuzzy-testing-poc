# Bombadil Reference

Complete reference for the Bombadil property-based testing framework used in this project.

## Installation

```bash
pnpm add -D @antithesishq/bombadil
```

The npm package bundles platform-specific binaries (Linux x64/arm64, macOS arm64). No manual download needed.

## Specification Language

A specification is a regular ES module exporting properties and action generators.

### Properties

Properties use temporal operators to express conditions over time:

```typescript
import { extract, always, eventually, next, now } from "@antithesishq/bombadil"

const pageTitle = extract(state => state.document.title || "")

export const pageHasTitle = always(() => pageTitle.current !== "")
```

**Temporal operators:**
- `always(x)` — holds if x holds in this and every future state
- `next(x)` — holds if x holds in the next state
- `eventually(x)` — holds if x holds in this or any future state
- `now(x)` — evaluate x in the current state only

**Logical connectives:**
- `x.and(y)` — both hold
- `x.or(y)` — at least one holds
- `x.implies(y)` — if x holds then y must hold
- `not(x)`, `x.not()` — negation

### Extractors

Extractors run inside the browser on every captured state:

```typescript
const notificationCount = extract((state) =>
  state.document.body.querySelectorAll(".notification").length
)
```

Return values are `Cell<T>` objects. Access the current value with `.current`.

### Action Generators

Define custom interactions:

```typescript
import { actions } from "@antithesishq/bombadil"

export const clickSubmit = actions(() => {
  const button = document.querySelector("button[type='submit']")
  if (!button) return []
  const rect = button.getBoundingClientRect()
  return [{
    Click: {
      name: "submit",
      point: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    }
  }]
})
```

**Action types:**
- `"Back"`, `"Forward"`, `"Reload"`, `"Wait"`
- `{ Click: { name, content?, point } }`
- `{ DoubleClick: { name, content?, point, delayMillis } }`
- `{ TypeText: { text, delayMillis } }`
- `{ PressKey: { code } }`
- `{ ScrollUp: { origin, distance } }`, `{ ScrollDown: { origin, distance } }`

### Defaults

Re-export all defaults:
```typescript
export * from "@antithesishq/bombadil/defaults"
```

Or selectively:
```typescript
export { noUncaughtExceptions } from "@antithesishq/bombadil/defaults/properties"
export { clicks, reload } from "@antithesishq/bombadil/defaults/actions"
```

## CLI Reference

### `bombadil test ORIGIN [SPEC]`

Run property-based tests against a web application.

**Flags:**
- `--headless` — Run browser in headless mode
- `--no-sandbox` — Disable Chrome sandbox (required in most CI environments)
- `--exit-on-violation` — Exit with code 2 on first property violation
- `--time-limit DURATION` — Max test duration (e.g., `2m`, `30s`, `1h`)
- `--output-path PATH` — Write results to directory for later inspection
- `--seed N` — Fix random seed for reproducibility

**Exit codes:**
- `0` — Test completed without violations (or `--exit-on-violation` not set)
- `2` — Property violation detected
- `1` — Platform/launch error

### `bombadil inspect PATH`

Launch the web-based inspector for a previous test run.

```bash
bombadil inspect ./bombadil-results
```

## Output Format

When `--output-path` is specified, Bombadil creates:
- `trace.jsonl` — JSON Lines containing:
  - States (DOM snapshots, extracted values)
  - Actions taken
  - Violations (property name, message, failing state)
- Screenshots at key states
- Downloaded assets

**Parsing trace.jsonl:**
```bash
# List all violations
jq -r 'select(.violation != null) | .property' trace.jsonl

# List all actions
jq -r 'select(.action != null) | .action' trace.jsonl
```

## CI Usage

```bash
# Build and start app
pnpm run build
pnpm run preview -- --port 4173 --host &
npx wait-on http://localhost:4173

# Run Bombadil
npx bombadil test http://localhost:4173 \
  --headless --no-sandbox \
  --exit-on-violation \
  --time-limit 2m \
  --output-path ./bombadil-results
```

## Examples

### Invariant: max notification count
```typescript
import { extract, always } from "@antithesishq/bombadil"
export * from "@antithesishq/bombadil/defaults"

const notificationCount = extract((state) =>
  state.document.body.querySelectorAll(".notification").length
)

export const maxNotifications = always(() =>
  notificationCount.current <= 5
)
```

### Guarantee: error disappears
```typescript
import { extract, always, now, eventually } from "@antithesishq/bombadil"
export * from "@antithesishq/bombadil/defaults"

const errorMessage = extract((state) =>
  state.document.body.querySelector(".error")?.textContent ?? null
)

export const errorDisappears = always(
  now(() => errorMessage.current !== null).implies(
    eventually(() => errorMessage.current === null).within(5, "seconds")
  )
)
```

### State machine: counter
```typescript
import { extract, always, now, next } from "@antithesishq/bombadil"
export * from "@antithesishq/bombadil/defaults"

const counterValue = extract((state) => {
  const element = state.document.body.querySelector("#counter")
  return parseInt(element?.textContent ?? "0", 10)
})

const unchanged = now(() => {
  const current = counterValue.current
  return next(() => counterValue.current === current)
})

const increment = now(() => {
  const current = counterValue.current
  return next(() => counterValue.current === current + 1)
})

const decrement = now(() => {
  const current = counterValue.current
  return next(() => counterValue.current === current - 1)
})

export const counterStateMachine = always(unchanged.or(increment).or(decrement))
```
