# Fuzzy Testing POC

An autonomous property-based testing pipeline for a React application. On every PR, the system runs maximum-strictness linting and typechecking, then fuzz-tests the running app with [Bombadil](https://github.com/antithesishq/bombadil). If Bombadil finds runtime exceptions, the results are reported on the PR.

## Tech Stack

- **App**: React 19 + Vite 8 + TypeScript 6 (maximum strictness)
- **Linting**: oxlint with all rules enabled
- **Fuzzy Testing**: Bombadil (`@antithesishq/bombadil`) — property-based UI testing using temporal logic
- **Autonomous Agent**: OpenCode Go with Kimi K2.6 (Phase 2)
- **Local CI Testing**: [Agent CI](https://agent-ci.dev) — official GitHub Actions runner locally with ~0ms caching and pause-on-failure

## Quick Start

```bash
# Install dependencies
pnpm install

# Dev server
pnpm run dev

# Build
pnpm run build

# Lint
pnpm run lint

# Typecheck
pnpm run typecheck
```

## Local CI Testing with Agent CI

Run the exact same PR workflow locally using the official GitHub Actions runner:

```bash
# Run the full PR workflow (lint + typecheck + 2min bombadil)
pnpm run gh-workflow

# Fast mode — 30s bombadil for quick validation (~3 min total)
pnpm run gh-workflow:fast

# Pause on failure so you can fix and retry the failed step
pnpm run gh-workflow:pause
```

**Requirements:** Docker Desktop or OrbStack must be running.

**Why Agent CI?** It bind-mounts your local `node_modules` for ~0ms cache warm-up, uses the real GitHub Actions runner (not a compatibility shim), and can pause on failure for interactive debugging.

## Multi-Step Checkout Form

The demo app is a 4-step checkout form designed to maximize Bombadil's state space:

1. **Personal Info** — name, email, phone with live validation
2. **Shipping Address** — country, address, city, state, postal code (conditional validation by country)
3. **Preferences** — newsletter, gift wrap, delivery instructions, promo code
4. **Review** — editable summary with dynamic pricing

**Interaction paths:**
- Next/Back navigation
- Skip to any step via progress indicator
- Terms & Conditions modal (accessible from any step)
- Save draft to `localStorage`
- Collapsible order summary sidebar
- Apply promo codes with async-style validation

This creates many non-deterministic paths for Bombadil to explore: rapid navigation, changing country mid-flow, opening modal during validation, etc.

## CI Pipeline

```
PR opened/updated
    │
    ▼
Lint & Typecheck ──► FAIL ──► Block PR
    │ PASS
    ▼
Build & Start Preview
    ▼
Bombadil (2 min default)
    │
    ├─ PASS ──► PR is clean
    │
    ▼ FAIL
Parse trace.jsonl
Post PR comment
Upload artifact
```

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BOMBADIL_TIME_LIMIT` | `2m` | Fuzzy test duration. Set via repository variables in GitHub Settings. |

## Phase 2 Roadmap

When ready, enable autonomous fixing:

1. Add `opencode-fix` job triggered on Bombadil failure
2. Parse trace and feed to `anomalyco/opencode/github@latest` with custom prompt
3. OpenCode creates branch `auto-fix/bombadil-{pr}-{timestamp}`
4. Max 1 attempt, skip existing `auto-fix/*` branches

## Project Structure

```
.
├── .github/workflows/fuzzy-test.yml   # Main CI workflow
├── .agents/skills/bombadil.md         # Agent skill for Bombadil context
├── docs/BOMBADIL.md                   # Complete Bombadil reference
├── src/
│   ├── App.tsx                        # Form container with step router
│   ├── components/                    # Step1–4, Navigation, Modal, Summary
│   ├── hooks/useFormState.ts          # Shared state + localStorage persistence
│   └── utils/validators.ts            # Pure validation functions
├── bombadil-spec.ts                   # Re-exports Bombadil defaults
├── .oxlintrc.json                     # Maximum strictness lint config
└── tsconfig.app.json                  # Maximum strictness TS config
```

## License

MIT
