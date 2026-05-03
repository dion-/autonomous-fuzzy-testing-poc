#!/usr/bin/env bash
set -euo pipefail

# Merge main into all branches that have open PRs, then push.
# Requires gh CLI authenticated with repo scope.

REPO="dion-/autonomous-fuzzy-testing-poc"

echo "=== Fetching open PRs ==="
PRS=$(GITHUB_TOKEN="${GITHUB_TOKEN:-}" gh pr list --repo "$REPO" --state open --json number,headRefName --jq '.[] | "\(.number):\(.headRefName)"')

if [ -z "$PRS" ]; then
  echo "No open PRs found."
  exit 0
fi

echo "=== Updating main ==="
git checkout main
git pull origin main

echo ""
while IFS=: read -r pr_num branch; do
  echo "=== PR #${pr_num}: merging main into ${branch} ==="
  git checkout "$branch"
  git pull origin "$branch" 2>/dev/null || true
  git merge main -m "Merge main into ${branch}"
  git push origin "$branch"
  echo ""
done <<< "$PRS"

echo "=== Done. Returning to main ==="
git checkout main
