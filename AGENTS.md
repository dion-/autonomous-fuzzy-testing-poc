# AGENTS.md

## Rules

- After making code changes, run both linting and tests to verify correctness:
  - `pnpm run lint` — runs oxlint (must pass with 0 warnings)
  - `pnpm run typecheck` — runs TypeScript type checking
  - `pnpm run test` — runs Vitest test suite
- When investigating a crash, do not trust stack-trace regex parsing alone. Use
  `grep`, `read`, and `glob` to explore the codebase autonomously and trace the
  full data flow.
- Tests must be co-located with their source files:
  - `src/utils/validators.test.ts` lives next to `src/utils/validators.ts`
  - `src/components/Modal.test.tsx` lives next to `src/components/Modal.tsx`
- Coverage thresholds are **100%** for lines, functions, branches, and
  statements. If a fix introduces a new branch, add tests to cover it.
- Fixes must be **minimal** and preserve existing logic. Do not invent new
  regexes, business rules, or behaviors.
- Iterate until `lint`, `typecheck`, and `test:coverage` all pass. Do not stop
  after a single attempt.
- Do not modify `node_modules`, build artifacts, or configuration files unless
  the root cause is provably there.
