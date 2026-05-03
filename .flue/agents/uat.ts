/* global process */

import type { FlueContext } from "@flue/sdk/client";
import { defineCommand } from "@flue/sdk/node";
import * as fs from "fs";

export const triggers = {};

interface PrContext {
  number?: string;
  repo?: string;
  title?: string;
  body?: string;
}

/**
 * Read GitHub Actions PR context from the event payload.
 */
function readPrContext(): PrContext {
  try {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!eventPath) return {};
    const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
    return {
      number: event.pull_request?.number?.toString(),
      repo: process.env.GITHUB_REPOSITORY,
      title: event.pull_request?.title,
      body: event.pull_request?.body,
    };
  } catch {
    return {};
  }
}

export default async function ({ init }: FlueContext) {
  const node = defineCommand("node");
  const pnpm = defineCommand("pnpm");
  const npx = defineCommand("npx");

  const agent = await init({
    sandbox: "local",
    model: "openai/gpt-4.1",
  });
  const session = await agent.session();

  // Ensure preview server is running (workflow usually starts it, but handle local runs too)
  const { exitCode: waitExit } = await session.shell(
    "npx wait-on http://localhost:4173 -t 5000 2>/dev/null || true"
  );
  if (waitExit !== 0) {
    await session.shell(
      "pnpm exec vite preview --port 4173 --host & npx wait-on http://localhost:4173"
    );
  }

  // Extract diff of src/ against main (workflow fetches origin/main first)
  const { stdout: diff } = await session.shell(
    'git diff origin/main...HEAD -- src/ || git diff HEAD~1 -- src/ || echo ""'
  );

  const pr = readPrContext();
  const runId = process.env.GITHUB_RUN_ID;
  const runUrl =
    runId && pr.repo
      ? `https://github.com/${pr.repo}/actions/runs/${runId}`
      : undefined;

  // Delegate to UAT skill
  await session.skill("uat", {
    args: {
      diff,
      prTitle: pr.title,
      prBody: pr.body,
      prNumber: pr.number,
      prRepo: pr.repo,
      runUrl,
    },
    commands: [node, pnpm, npx],
  });

  // Read skill result
  const { stdout: resultJson } = await session.shell(
    "cat flue-result.json 2>/dev/null || echo '{}'"
  );
  const result = JSON.parse(resultJson || "{}");

  // Post PR comment
  if (pr.number && pr.repo && fs.existsSync("flue-comment.md")) {
    const gh = defineCommand("gh", {
      env: { GH_TOKEN: process.env.GH_TOKEN ?? "" },
    });
    const { exitCode, stderr } = await session.shell(
      `gh pr comment ${pr.number} --repo ${pr.repo} --body-file flue-comment.md`,
      { commands: [gh] }
    );
    if (exitCode !== 0) {
      console.error("Failed to post PR comment:", stderr);
    }
  }

  return {
    status: result.status === "success" ? "success" : "neutral",
    summary: result.summary,
    screenshots: result.screenshots ?? [],
    videos: result.videos ?? [],
  };
}
