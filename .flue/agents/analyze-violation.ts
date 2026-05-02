import type { FlueContext } from '@flue/sdk/client';
import * as v from 'valibot';

export const triggers = {};

export default async function ({ init }: FlueContext) {
  const agent = await init({
    sandbox: 'local',
    model: 'openai/gpt-4.1',
  });
  const session = await agent.session();

  // Extract violation details from trace.jsonl
  const { stdout: violationJson } = await session.shell(
    `jq -s 'map(select(.violations | length > 0)) | .[0]' bombadil-results/trace.jsonl`
  );

  const violation = JSON.parse(violationJson || '{}');
  const uncaughtExceptions = violation?.snapshots?.find((s: any) => s.name === 'uncaughtExceptions')?.value || [];
  const stackTrace = uncaughtExceptions[0] || '';

  const errorMatch = stackTrace.match(/Uncaught (\w+Error):\s*(.+)/);
  const errorType = errorMatch ? errorMatch[1] : 'Unknown';
  const errorMessage = errorMatch ? errorMatch[2] : stackTrace;

  // Extract last 10 actions before violation for repro context
  const { stdout: actionsJson } = await session.shell(
    `jq -s 'map(select(.action != null and .action != "Wait")) | .[-10:] | map({action: .action, timestamp: .timestamp})' bombadil-results/trace.jsonl 2>/dev/null || echo '[]'`
  );

  // STEP 1: Parse function names from the stack trace
  // Stack frames look like: "    at formatPhone (http://.../index-xxx.js:18718:17)"
  const frameRegex = /at\s+([\w$]+)\s+\([^)]+\)/g;
  const functionNames: string[] = [];
  let m;
  while ((m = frameRegex.exec(stackTrace)) !== null) {
    functionNames.push(m[1]);
  }

  // Filter out framework internals (React, etc.)
  const appFunctions = functionNames.filter(
    (name) => !['renderWithHooks', 'updateFunctionComponent', 'beginWork', 'performUnitOfWork', 'workLoopSync', 'renderRootSync', 'performWorkOnRoot', 'performSyncWorkOnRoot', 'flushSyncWorkAcrossRoots_impl', 'processRootScheduleInMicrotask'].includes(name)
  );

  // STEP 2: Search for each app function in the source code
  let fileMap: Record<string, { file: string; line: number }> = {};
  for (const funcName of appFunctions) {
    try {
      const { stdout: hits } = await session.shell(
        `rg -n "(function|const|let|var|export)\\s+${funcName}\\b|\\b${funcName}\\s*[=:]" src/ --type ts --type tsx 2>/dev/null | head -10 || true`
      );
      if (hits.trim()) {
        // Parse first hit: "src/utils/validators.ts:35:export function formatPhone..."
        const firstLine = hits.trim().split('\n')[0];
        const match = firstLine.match(/^([^:]+):(\d+):/);
        if (match && !fileMap[funcName]) {
          fileMap[funcName] = { file: match[1], line: parseInt(match[2], 10) };
        }
      }
    } catch {
      // ignore
    }
  }

  // STEP 3: Determine primary and secondary files
  const primaryFunc = appFunctions[0]; // The function where the error occurred
  const secondaryFuncs = appFunctions.slice(1); // Callers

  const primaryFile = primaryFunc && fileMap[primaryFunc] ? fileMap[primaryFunc] : null;
  const secondaryFiles = secondaryFuncs
    .map((f) => fileMap[f])
    .filter(Boolean) as { file: string; line: number }[];

  if (!primaryFile) {
    return {
      error: `Could not locate source for function "${primaryFunc}" from stack trace.`,
      functionNames,
      appFunctions,
      stackTrace,
    };
  }

  // STEP 4: Read primary file
  const { stdout: primaryContent } = await session.shell(
    `cat ${primaryFile.file} 2>/dev/null || echo "FILE_NOT_FOUND"`
  );

  if (primaryContent === 'FILE_NOT_FOUND') {
    return {
      error: `Could not read file: ${primaryFile.file}`,
      primaryFile,
    };
  }

  // Read secondary files for call-site context
  let secondaryContents: string[] = [];
  for (const sf of secondaryFiles) {
    try {
      const { stdout: content } = await session.shell(`cat ${sf.file} 2>/dev/null || echo ""`);
      if (content) {
        secondaryContents.push(`--- ${sf.file} ---\n${content}`);
      }
    } catch {
      // ignore
    }
  }

  // STEP 5: LLM diagnosis with full file context
  const diagnosis = await session.prompt(
    `You are an expert frontend debugger analyzing a production app crash found by fuzzy testing.\n\n` +
    `ERROR TYPE: ${errorType}\n` +
    `ERROR MESSAGE: ${errorMessage}\n\n` +
    `STACK TRACE (function names preserved, minification disabled):\n${stackTrace}\n\n` +
    `LAST ACTIONS BEFORE CRASH:\n${actionsJson}\n\n` +
    `PRIMARY SOURCE FILE (${primaryFile.file}, line ~${primaryFile.line}):\n${primaryContent}\n\n` +
    (secondaryContents.length > 0
      ? `CALLER FILES:\n${secondaryContents.join('\n\n')}\n\n`
      : '') +
    `Your task:\n` +
    `1. Analyze the error message and stack trace carefully.\n` +
    `2. The error occurred in function "${primaryFunc}" in ${primaryFile.file}.\n` +
    `3. Identify the EXACT line number and root cause.\n` +
    `4. Consider how the error message relates to the code (e.g., "Cannot read properties of null" often means a null/undefined value was used where an object was expected).\n\n` +
    `Return ONLY the file path and line number.`,
    {
      result: v.object({
        file: v.string(),
        line: v.number(),
      }),
    },
  );

  // STEP 6: Read the exact file (might be different from primary if LLM corrected it)
  const targetFile = diagnosis.file || primaryFile.file;
  const { stdout: targetContent } = await session.shell(
    `cat ${targetFile} 2>/dev/null || echo "FILE_NOT_FOUND"`
  );

  if (targetContent === 'FILE_NOT_FOUND') {
    return {
      diagnosis,
      error: `Could not read file: ${targetFile}`,
    };
  }

  // STEP 7: Generate fix
  const fixText = await session.prompt(
    `You are fixing a bug in ${targetFile}.\n\n` +
    `ERROR: ${errorType}: ${errorMessage}\n\n` +
    `STACK TRACE CONTEXT:\n` +
    `- Error occurred in function: ${primaryFunc}\n` +
    `- Called from: ${secondaryFuncs.join(', ')}\n\n` +
    `FULL FILE CONTENT:\n${targetContent}\n\n` +
    `RULES:\n` +
    `1. oldString must be an EXACT, UNIQUE substring from the file above.\n` +
    `2. newString must be the corrected version.\n` +
    `3. Preserve ALL existing logic, comments, and formatting.\n` +
    `4. Only change what is necessary to fix the bug.\n` +
    `5. Do NOT invent new regex patterns or logic.\n\n` +
    `OUTPUT FORMAT (strict):\n` +
    `EXPLANATION: <one sentence describing the fix>\n` +
    `OLD:\n<exact old code>\n` +
    `NEW:\n<exact new code>\n` +
    `END`,
  );

  const fixTextStr = typeof fixText === 'string' ? fixText : (fixText as any)?.text || String(fixText);
  const explanationMatch = fixTextStr.match(/EXPLANATION:\s*(.+)/);
  const oldMatch = fixTextStr.match(/OLD:\n([\s\S]+?)\nNEW:/);
  const newMatch = fixTextStr.match(/NEW:\n([\s\S]+?)\nEND/);

  return {
    diagnosis: {
      file: targetFile,
      line: diagnosis.line,
      errorType,
      errorMessage,
      primaryFunc,
      callerFuncs: secondaryFuncs,
    },
    fix: {
      oldString: oldMatch ? oldMatch[1].trimEnd() : '',
      newString: newMatch ? newMatch[1].trimEnd() : '',
      explanation: explanationMatch ? explanationMatch[1] : '',
    },
    fileContent: targetContent,
    context: {
      functionNames,
      appFunctions,
      fileMap,
      primaryFile,
      secondaryFiles,
    },
  };
}
