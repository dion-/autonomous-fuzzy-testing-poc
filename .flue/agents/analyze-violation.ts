import type { FlueContext } from '@flue/sdk/client';
import { defineCommand } from '@flue/sdk/node';

export const triggers = {};

/**
 * Write a file via shell using base64 to avoid escaping issues.
 * @param {{ shell: (cmd: string) => Promise<{ stdout: string; stderr: string; exitCode: number }> }} session - Agent session with shell method.
 * @param {string} path - File path to write to.
 * @param {string} content - File content.
 */
async function writeFile(
  session: { shell: (cmd: string) => Promise<{ stdout: string; stderr: string; exitCode: number }> },
  path: string,
  content: string
) {
  // eslint-disable-next-line no-undef
  const b64 = Buffer.from(content, 'utf8').toString('base64');
  const { exitCode, stderr } = await session.shell(
    `printf "%s" "${b64}" | base64 -d > ${path}`
  );
  if (exitCode !== 0) {
    throw new Error(`Failed to write ${path}: ${stderr}`);
  }
}

export default async function ({ init }: FlueContext) {
  // Connect host CLIs so the skill can run lint/typecheck/tests.
  const node = defineCommand('node');
  const pnpm = defineCommand('pnpm');
  const npx = defineCommand('npx');

  const agent = await init({
    sandbox: 'local',
    model: 'openai/gpt-4.1',
  });
  const session = await agent.session();

  // ── 1. Extract raw violation from trace ──────────────────────────────────
  const { stdout: violationJson } = await session.shell(
    `jq -s 'map(select(.violations | length > 0)) | .[0]' bombadil-results/trace.jsonl`
  );

  const violation = JSON.parse(violationJson || '{}');
  const uncaughtExceptions =
    violation?.snapshots?.find((s: any) => s.name === 'uncaughtExceptions')?.value ?? [];

  const { stdout: actionsJson } = await session.shell(
    `jq -s 'map(select(.action != null and .action != "Wait")) | .[-10:] | map({action,timestamp})' bombadil-results/trace.jsonl 2>/dev/null || echo '[]'`
  );

  const traceContext = JSON.stringify({
    violation,
    uncaughtExceptions,
    actionsBeforeCrash: JSON.parse(actionsJson || '[]'),
  });

  // ── 2. Delegate entirely to the autonomous skill ─────────────────────────
  // The skill writes flue-result.json when it finishes.
  await session.skill('analyze-violation', {
    args: { traceContext },
    commands: [node, pnpm, npx],
  });

  // ── 3. Read the structured result produced by the skill ──────────────────
  const { stdout: resultJson, exitCode: resultExit } = await session.shell(
    'cat flue-result.json 2>/dev/null || echo ""'
  );

  if (resultExit !== 0 || !resultJson.trim()) {
    throw new Error('Skill did not produce flue-result.json');
  }

  const result = JSON.parse(resultJson);

  // ── 4. Build rich PR comment ─────────────────────────────────────────────
  const diffBlock =
    result.oldCode && result.newCode
      ? `\`\`\`diff\n${result.oldCode
          .split('\n')
          .map((l: string) => `- ${l}`)
          .join('\n')}\n${result.newCode
          .split('\n')
          .map((l: string) => `+ ${l}`)
          .join('\n')}\n\`\`\``
      : '*No diff available.*';

  const commentMarkdown = `## 🐛 Bombadil Fuzzy Test Failure

### Problem

${result.problemDescription}

### Reproduction

A breaking test was added in \`${result.testFile}\`.

### Fix

${diffBlock}

### Rationale

${result.rationale}

### Verification

| Check | Status |
|---|---|
| Lint | ${result.verificationStatus === 'verified' ? '✅' : '❌'} |
| Typecheck | ${result.verificationStatus === 'verified' ? '✅' : '❌'} |
| Tests + Coverage | ${result.verificationStatus === 'verified' ? '✅' : '❌'} |

<pre>${result.verificationOutput}</pre>

---

Full trace, screenshots and state transitions are available in the \`bombadil-results\` artifact.

\`\`\`bash
npx bombadil inspect bombadil-results
\`\`\`
`;

  await writeFile(session, 'flue-comment.md', commentMarkdown);

  const outputJson = JSON.stringify(
    {
      diagnosis: {
        file: result.file,
        line: result.line,
      },
      analysis: {
        problemDescription: result.problemDescription,
        rationale: result.rationale,
        oldCode: result.oldCode,
        newCode: result.newCode,
        testFile: result.testFile,
        verificationStatus: result.verificationStatus,
        verificationOutput: result.verificationOutput,
      },
    },
    null,
    2
  );
  await writeFile(session, 'flue-result.json', outputJson);

  return {
    status: result.verificationStatus === 'verified' ? 'success' : 'partial',
    file: result.file,
    line: result.line,
    verificationStatus: result.verificationStatus,
  };
}
