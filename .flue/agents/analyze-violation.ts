import type { FlueContext } from '@flue/sdk/client';
import * as v from 'valibot';

export const triggers = {};

/** Write a file via shell using base64 to avoid escaping issues. */
async function writeFile(
  session: { shell: (cmd: string) => Promise<{ stdout: string; stderr: string; exitCode: number }> },
  path: string,
  content: string
) {
  const b64 = Buffer.from(content, 'utf-8').toString('base64');
  const { exitCode, stderr } = await session.shell(`printf "%s" "${b64}" | base64 -d > ${path}`);
  if (exitCode !== 0) {
    throw new Error(`Failed to write ${path}: ${stderr}`);
  }
}

export default async function ({ init }: FlueContext) {
  const agent = await init({
    sandbox: 'local',
    model: 'openai/gpt-4.1',
  });
  const session = await agent.session();

  // ── 1. Extract violation from trace ──────────────────────────────────────
  const { stdout: violationJson } = await session.shell(
    `jq -s 'map(select(.violations | length > 0)) | .[0]' bombadil-results/trace.jsonl`
  );

  const violation = JSON.parse(violationJson || '{}');
  const uncaughtExceptions =
    violation?.snapshots?.find((s: any) => s.name === 'uncaughtExceptions')?.value || [];
  const stackTrace = uncaughtExceptions[0] || '';

  const errorMatch = stackTrace.match(/Uncaught (\w+Error):\s*(.+)/);
  const errorType = errorMatch ? errorMatch[1] : 'Unknown';
  const errorMessage = errorMatch ? errorMatch[2] : stackTrace;

  const { stdout: actionsJson } = await session.shell(
    `jq -s 'map(select(.action != null and .action != "Wait")) | .[-10:] | map({action: .action, timestamp: .timestamp})' bombadil-results/trace.jsonl 2>/dev/null || echo '[]'`
  );

  // ── 2. Parse function names from stack ───────────────────────────────────
  const frameRegex = /at\s+([\w$]+)\s+\([^)]+\)/g;
  const functionNames: string[] = [];
  let m;
  while ((m = frameRegex.exec(stackTrace)) !== null) {
    functionNames.push(m[1]);
  }

  const appFunctions = functionNames.filter(
    (name) =>
      ![
        'renderWithHooks',
        'updateFunctionComponent',
        'beginWork',
        'performUnitOfWork',
        'workLoopSync',
        'renderRootSync',
        'performWorkOnRoot',
        'performSyncWorkOnRoot',
        'flushSyncWorkAcrossRoots_impl',
        'processRootScheduleInMicrotask',
      ].includes(name)
  );

  // ── 3. Search source for each function ───────────────────────────────────
  const searchResults = await Promise.all(
    appFunctions.map(async (funcName) => {
      try {
        const { stdout: hits } = await session.shell(
          `rg -n "(function|const|let|var|export)\\s+${funcName}\\b|\\b${funcName}\\s*[=:]" src/ --type ts --type tsx 2>/dev/null | head -10 || true`
        );
        return { funcName, hits };
      } catch {
        return { funcName, hits: '' };
      }
    })
  );

  const fileMap: Record<string, { file: string; line: number }> = {};
  for (const { funcName, hits } of searchResults) {
    if (hits.trim()) {
      const firstLine = hits.trim().split('\n')[0];
      const match = firstLine.match(/^([^:]+):(\d+):/);
      if (match && !fileMap[funcName]) {
        fileMap[funcName] = { file: match[1], line: parseInt(match[2], 10) };
      }
    }
  }

  const primaryFunc = appFunctions[0];
  const secondaryFuncs = appFunctions.slice(1);

  const primaryFile = primaryFunc && fileMap[primaryFunc] ? fileMap[primaryFunc] : null;
  const secondaryFiles = secondaryFuncs
    .map((f) => fileMap[f])
    .filter(Boolean) as { file: string; line: number }[];

  if (!primaryFile) {
    await writeFile(
      session,
      'flue-comment.md',
      buildFallbackComment('Could not locate source for function from stack trace.', stackTrace)
    );
    return { status: 'fallback', reason: 'no_primary_file' };
  }

  // ── 4. Read source files ─────────────────────────────────────────────────
  const { stdout: primaryContent } = await session.shell(
    `cat ${primaryFile.file} 2>/dev/null || echo "FILE_NOT_FOUND"`
  );
  if (primaryContent === 'FILE_NOT_FOUND') {
    await writeFile(
      session,
      'flue-comment.md',
      buildFallbackComment(`Could not read file: ${primaryFile.file}`, stackTrace)
    );
    return { status: 'fallback', reason: 'file_not_found' };
  }

  const secondaryContents = (
    await Promise.all(
      secondaryFiles.map(async (sf) => {
        try {
          const { stdout: content } = await session.shell(`cat ${sf.file} 2>/dev/null || echo ""`);
          return content ? `--- ${sf.file} ---\n${content}` : '';
        } catch {
          return '';
        }
      })
    )
  ).filter(Boolean);

  // ── 5. Unified LLM analysis ──────────────────────────────────────────────
  // This single prompt asks the LLM to analyze the bug and produce either
  // a concrete diff or an explanatory suggestion. It does NOT assume a
  // single-line fix.
  const analysis = await session.prompt(
    `You are an expert debugger analyzing a crash found by automated fuzzy testing.\n\n` +
      `ERROR TYPE: ${errorType}\n` +
      `ERROR MESSAGE: ${errorMessage}\n\n` +
      `STACK TRACE:\n${stackTrace}\n\n` +
      `LAST ACTIONS BEFORE CRASH:\n${actionsJson}\n\n` +
      `PRIMARY SOURCE FILE (${primaryFile.file}, line ~${primaryFile.line}):\n${primaryContent}\n\n` +
      (secondaryContents.length > 0
        ? `CALLER FILES:\n${secondaryContents.join('\n\n')}\n\n`
        : '') +
      `Analyze the crash and return your findings. Be specific and concise.\n\n` +
      `If you can identify a concrete, localized code change that fixes the bug, set suggestionType to "diff" and provide oldCode and newCode.\n` +
      `oldCode must be an EXACT substring from the primary source file above.\n` +
      `newCode must be the corrected replacement.\n` +
      `The diff may span multiple lines if necessary.\n\n` +
      `If the fix is unclear, requires changes across multiple files, or is architectural in nature, set suggestionType to "explanation" and provide suggestionText instead.\n` +
      `In explanation mode, describe what is wrong and what the developer should do to fix it.`,
    {
      result: v.object({
        file: v.string(),
        line: v.number(),
        summary: v.string(),
        suggestionType: v.picklist(['diff', 'explanation']),
        oldCode: v.optional(v.string()),
        newCode: v.optional(v.string()),
        suggestionText: v.optional(v.string()),
      }),
    }
  );

  const targetFile = analysis.file || primaryFile.file;

  // ── 6. Build and write PR comment ────────────────────────────────────────
  const commentMarkdown = buildComment({
    file: targetFile,
    line: analysis.line,
    errorType,
    errorMessage,
    primaryFunc,
    secondaryFuncs,
    summary: analysis.summary,
    suggestionType: analysis.suggestionType,
    oldCode: analysis.oldCode || '',
    newCode: analysis.newCode || '',
    suggestionText: analysis.suggestionText || '',
  });

  await writeFile(session, 'flue-comment.md', commentMarkdown);

  const resultJson = JSON.stringify(
    {
      diagnosis: {
        file: targetFile,
        line: analysis.line,
        errorType,
        errorMessage,
        primaryFunc,
        callerFuncs: secondaryFuncs,
      },
      analysis: {
        summary: analysis.summary,
        suggestionType: analysis.suggestionType,
        oldCode: analysis.oldCode,
        newCode: analysis.newCode,
        suggestionText: analysis.suggestionText,
      },
    },
    null,
    2
  );
  await writeFile(session, 'flue-result.json', resultJson);

  return { status: 'success', file: targetFile, line: analysis.line };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildComment(data: {
  file: string;
  line: number;
  errorType: string;
  errorMessage: string;
  primaryFunc: string;
  secondaryFuncs: string[];
  summary: string;
  suggestionType: 'diff' | 'explanation';
  oldCode: string;
  newCode: string;
  suggestionText: string;
}): string {
  let body = `## 🐛 Bombadil detected a crash

> ${data.summary}

**\`${data.file}\`:**${data.line} — \`${data.primaryFunc}\` throws ${data.errorType}
`;

  if (data.secondaryFuncs.length > 0) {
    body += `\nCalled from: ${data.secondaryFuncs.join(' ← ')}\n`;
  }

  if (data.suggestionType === 'diff' && data.oldCode && data.newCode) {
    const diffOld = data.oldCode
      .split('\n')
      .map((l) => `- ${l}`)
      .join('\n');
    const diffNew = data.newCode
      .split('\n')
      .map((l) => `+ ${l}`)
      .join('\n');

    body += `
\`\`\`diff
${diffOld}
${diffNew}
\`\`\`
`;
  } else if (data.suggestionType === 'explanation' && data.suggestionText) {
    body += `
${data.suggestionText}
`;
  }

  body += `
---

Full trace, screenshots and state transitions are available in the \`bombadil-results\` artifact.

\`\`\`bash
npx bombadil inspect bombadil-results
\`\`\`
`;

  return body;
}

function buildFallbackComment(reason: string, stackTrace: string): string {
  return `## 🐛 Bombadil detected a crash

${reason}

**Stack trace:**
\`\`\`
${stackTrace || 'N/A'}
\`\`\`

---

Full trace, screenshots and state transitions are available in the \`bombadil-results\` artifact.

\`\`\`bash
npx bombadil inspect bombadil-results
\`\`\`
`;
}
