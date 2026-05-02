# Analyze Bombadil Violation

Use this skill when analyzing a Bombadil fuzzy-test failure trace.

## Workflow

1. **Extract violation** from `bombadil-results/trace.jsonl` using `jq`
2. **Parse error** type and message from `uncaughtExceptions` snapshot
3. **Search codebase** with targeted `rg` patterns based on the error message:
   - `Cannot read properties of null/undefined` → search `match\[`, `\.match\(`, `!\)`
   - `is not a function` → search function call patterns
   - `undefined` → search optional access patterns
4. **Read likely source files** (heuristic or grep-derived)
5. **Diagnose** with structured output: `{ file, line }`
6. **Generate fix** by reading line context and producing an `oldString`/`newString` diff

## Key Principles

- Use a **two-step prompt**: diagnose first, then fix. This keeps each prompt focused.
- Use **plain text** for the diff step to avoid JSON escaping issues with regex/code.
- **Preserve existing logic** — never invent new regex patterns or business rules.
- Include **action history** from the trace to help the LLM understand the reproduction path.

## Output Format

Return a structured object:

```json
{
  "diagnosis": {
    "file": "string",
    "line": number,
    "errorType": "string",
    "errorMessage": "string",
    "actionsBefore": [...]
  },
  "fix": {
    "oldString": "exact original code",
    "newString": "corrected code",
    "explanation": "one sentence"
  }
}
```
