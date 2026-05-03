/* global process */

import type { FlueContext } from '@flue/sdk/client';
import { defineCommand } from '@flue/sdk/node';
import * as fs from 'fs';

export const triggers = {};

/**
 * Read GitHub Actions PR context from the event payload.
 * @returns {{ number?: string; repo?: string }} PR number and repo, if available.
 */
function readPrContext(): { number?: string; repo?: string } {
  try {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!eventPath) return {};
    const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    return {
      number: event.pull_request?.number?.toString(),
      repo: process.env.GITHUB_REPOSITORY,
    };
  } catch {
    return {};
  }
}

export default async function ({ init }: FlueContext) {
  // Connect host CLIs so the skill can run lint/typecheck/tests and post comments.
  const node = defineCommand('node');
  const pnpm = defineCommand('pnpm');
  const npx = defineCommand('npx');
  const gh = defineCommand('gh');

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

  const pr = readPrContext();

  const traceContext = JSON.stringify({
    violation,
    uncaughtExceptions,
    actionsBeforeCrash: JSON.parse(actionsJson || '[]'),
  });

  // ── 2. Delegate entirely to the autonomous skill ─────────────────────────
  // The skill investigates, fixes, verifies, crafts a PR comment, and posts it.
  await session.skill('analyze-violation', {
    args: { traceContext, prNumber: pr.number, repo: pr.repo },
    commands: [node, pnpm, npx, gh],
  });

  // ── 3. Read the structured result produced by the skill ──────────────────
  const { stdout: resultJson } = await session.shell(
    'cat flue-result.json 2>/dev/null || echo "{}"'
  );

  const result = JSON.parse(resultJson || '{}');

  return {
    status: result.verificationStatus === 'verified' ? 'success' : 'partial',
    file: result.file,
    line: result.line,
    verificationStatus: result.verificationStatus,
  };
}
