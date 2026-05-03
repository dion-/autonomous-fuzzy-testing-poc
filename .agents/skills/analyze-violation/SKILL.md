---
name: analyze-violation
description: >
  Analyze a Bombadil fuzzy-test crash trace, reproduce the bug with a
  co-located breaking test, apply a minimal fix, verify with lint,
  typecheck, and 100% coverage tests, then craft and post a PR comment.
---

## Mission

You are an expert autonomous debugger. A Bombadil fuzzy-test run has crashed
with an uncaught exception. Your job is to:

1. **Investigate** the crash by exploring the codebase.
2. **Reproduce** it with a breaking test.
3. **Fix** the source code minimally.
4. **Verify** that lint, typecheck, and tests (with 100% coverage) pass.
5. **Craft and post** a PR comment describing what you found and did.

## Input

You receive:

- `traceContext` — JSON string with the Bombadil violation, uncaught exceptions,
  and action history.
- `prNumber` — The GitHub pull request number (if running in CI).
- `repo` — The GitHub repository in `owner/repo` format (if running in CI).

## Tools at your disposal

Use the built-in tools freely:
- `read` — read files or list directories
- `grep` — regex search file contents
- `glob` — find files by pattern
- `edit` — exact-text replacement in files
- `bash` — run shell commands
- `task` — delegate parallel research if needed

## Step-by-step workflow

### 1. Understand the crash

Extract the error type and message from `uncaughtExceptions[0]`.

If the stack trace contains readable source file names and line numbers, use
those as starting points. If the stack is minified or obfuscated (e.g.
`index-DpaRbvNM.js:18718`), search the **source** codebase using the error
message and relevant code patterns instead.

**Do not trust regex-parsed function names blindly.** Use `grep` to search for
the error pattern, then `read` the relevant files to understand the data flow.
The bug may span multiple files (e.g. a component passes bad props, but the
crash happens in a utility).

### 2. Write a breaking test FIRST

**You MUST write a new breaking test BEFORE applying any fix.** This is
non-negotiable. The test must fail when run against the current buggy code.

Find the source file responsible for the crash. Locate its co-located test file
(`*.test.ts` or `*.test.tsx` in the same directory). If none exists, create one.

Write a **minimal** test that reproduces the exact crash scenario inferred from
the trace. For example, if the crash is `Cannot read properties of null`, pass
the input that produces `null` in the code path.

**Use `edit` to add the new test to the existing test file.** Do not use `write`
— that would overwrite and destroy the existing tests. Find the closing `});` of
the relevant `describe` block and insert your new `it(...)` before it.

Run the test to confirm it **fails**:
```bash
pnpm run test -- <pattern>
```

If the test passes, it means you haven't reproduced the bug. Refine your
understanding of the crash and adjust the test until it fails.

### 3. Apply the minimal fix

Only after the test fails, use `edit` to change the source. The fix must:
- Be **minimal** — change only what's necessary.
- **Preserve existing logic** — never invent new regexes, business rules, or
  behavior that wasn't already implied.
- **Handle the edge case** that caused the crash.

If multiple files need changes, edit each one.

### 4. Verify (and iterate)

Run the verification commands **one at a time** (not in parallel). Wait for each
to finish before starting the next:

1. ```bash
   pnpm run lint
   ```
2. ```bash
   pnpm run typecheck
   ```
3. ```bash
   pnpm run test:coverage
   ```

**If any step fails:**
- Read the failure output carefully.
- Determine whether the fix, the test, or both need adjustment.
- Apply changes with `edit`.
- **Re-run ALL verification commands from the beginning** (lint → typecheck →
  test:coverage) after any edit. Do not just re-run the failing command, because
  an edit that fixes one issue might introduce another.

**If coverage drops below 100%** (lines, functions, branches, statements):
- Add more tests to cover the newly introduced branches.
- Re-run the full verification suite from the beginning.

Repeat this loop as many times as needed. Do not stop until lint, typecheck,
and coverage tests are all green.

### 5. Craft and post a PR comment

Once verification passes, write a clear, helpful PR comment. **You have full
freedom to choose the format** — use tables, collapsible sections, diff blocks,
or bullet points as appropriate for the complexity and nature of the bug.

The comment should communicate:
- What crashed and why
- Where the bug was located
- What fix you applied
- That lint, typecheck, and tests all pass

Write the comment to `flue-comment.md` using Node (to avoid escaping issues):

```bash
node -e '
const fs = require("fs");
fs.writeFileSync("flue-comment.md", `## Your crafted comment here...`);
'
```

If `prNumber` and `repo` are available, post the comment directly to the PR:

```bash
gh pr comment <prNumber> --repo <repo> --body-file flue-comment.md
```

If posting fails, diagnose the `gh` error and retry once. If it still fails,
keep `flue-comment.md` written so humans can post it manually.

### 6. Persist the result

Write a minimal JSON file named `flue-result.json` in the root of the workspace.
Use Node to serialize it to guarantee valid JSON:

```bash
node -e '
const fs = require("fs");
fs.writeFileSync("flue-result.json", JSON.stringify({
  file: "...",
  line: 0,
  verificationStatus: "verified",
  verificationOutput: "..."
}, null, 2));
'
```

If verification ultimately fails after multiple attempts, set
`verificationStatus` to `"failed"` and include the last failure output in
`verificationOutput`.

## Guardrails

- Do **not** modify `node_modules`, build artifacts, or config files unless the
  bug is provably there.
- Keep test files **co-located** with their source (`src/utils/validators.test.ts`
  lives next to `src/utils/validators.ts`).
- Do **not** stop at the first file that mentions the crashing function. Trace
  the data flow to find the true root cause.
- When using `edit`, ensure `oldCode` is an **exact, unique** match in the file.
