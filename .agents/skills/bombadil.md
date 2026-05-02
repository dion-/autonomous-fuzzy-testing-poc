# Bombadil Property-Based Testing

You are working with Bombadil, a property-based testing framework for web UIs built by Antithesis. It uses temporal logic (Linear Temporal Logic) to validate correctness properties over sequences of browser states.

## When to Use

Use this skill when:
- Analyzing Bombadil test failures (trace.jsonl)
- Writing or modifying Bombadil specification files
- Debugging runtime exceptions found by fuzzy testing
- Understanding why a property was violated

## Core Concepts

### Properties
Properties describe how the system should behave in general (not for specific cases). They are exported from a TypeScript/JavaScript module.

**Temporal operators:**
- `always(x)` — x must hold in this and every future state
- `next(x)` — x must hold in the next state
- `eventually(x)` — x must hold in this or some future state
- `now(x)` — evaluate x in the current state only
- `not(x)`, `x.and(y)`, `x.or(y)`, `x.implies(y)` — logical connectives

### Extractors
Extractors capture browser state on every transition:
```typescript
const pageTitle = extract(state => state.document.title || "")
export const pageHasTitle = always(() => pageTitle.current !== "")
```

### Action Generators
Action generators produce possible actions for Bombadil to execute:
```typescript
export const myAction = actions(() => {
  return [{ Click: { name: "submit", point: { x: 100, y: 200 } } }]
})
```

## Default Properties and Actions

The defaults cover most apps:
```typescript
export * from "@antithesishq/bombadil/defaults"
```

**Default properties:**
- `noUncaughtExceptions`
- `noUnhandledRejections`
- `noErrorLogs`
- `noHttp4xx`
- `noHttp5xx`

**Default actions:**
- `clicks` — clicks semantic HTML elements
- `reload` — page reload
- `back`, `forward` — browser history

## CLI Usage

```bash
# Test a deployed URL
bombadil test https://example.com

# Test a local server (CI)
bombadil test http://localhost:4173 \
  --headless \
  --no-sandbox \
  --exit-on-violation \
  --time-limit 2m \
  --output-path ./bombadil-results

# Inspect results
bombadil inspect ./bombadil-results
```

## Exit Codes
- `0` — success (no violations, or `--exit-on-violation` not set)
- `2` — property violation (only with `--exit-on-violation`)
- `1` — platform/launch error

## Output Artifacts
When `--output-path` is set, Bombadil writes:
- `trace.jsonl` — JSON Lines with states, actions, snapshots, violations
- Screenshots of key states
- Downloaded assets

Parse `trace.jsonl` for violations:
```bash
jq -r 'select(.violation != null) | .property' trace.jsonl
```

## Fixing Violations

When Bombadil finds `noUncaughtExceptions`:
1. Look at `trace.jsonl` for the action sequence that triggered the exception
2. Check browser console logs if available
3. Find the component/function that throws under those conditions
4. Add null guards, race condition fixes, or input validation
5. Re-run Bombadil to confirm the fix

## Specification File Template

```typescript
import { extract, always, eventually, actions } from "@antithesishq/bombadil"
export * from "@antithesishq/bombadil/defaults"

// Custom extractor
const notificationCount = extract((state) =>
  state.document.body.querySelectorAll(".notification").length
)

// Custom property
export const maxNotifications = always(() =>
  notificationCount.current <= 5
)
```
