---
name: token-efficient-engineering
description: Minimize token and context use during repository exploration, debugging, implementation, and review. Use for nontrivial coding tasks where the agent should batch reads, avoid repeated searches, load only relevant files, make scoped changes, and report concisely without sacrificing correctness.
---

# Token-Efficient Engineering

Use the smallest amount of context that can support a correct, verified result.

## Establish Scope

1. State the concrete objective internally in one sentence.
2. Inspect repository status and the nearest relevant code boundary.
3. Identify the minimum files, contracts, and tests likely to matter.
4. Ask a question only when the answer materially changes scope or behavior.

## Retrieve Efficiently

- Query an existing `graphify-out/graph.json` before broad source exploration.
- Use `rg` or file indexes to locate symbols before opening files.
- Batch independent searches and reads.
- Limit command output to relevant paths, matches, or line ranges.
- Reuse facts and outputs already obtained; do not reread unchanged files.
- Stop exploring once evidence is sufficient to implement and verify safely.

## Execute Efficiently

- Follow the repository's existing pattern instead of inventing a parallel one.
- Make the smallest coherent patch that completes the request.
- Avoid speculative abstractions, unrelated cleanup, and broad formatting churn.
- Prefer parsers, structured APIs, and existing scripts over ad hoc processing.
- Load long references only when the current decision requires them.

## Validate Proportionally

1. Run the narrowest relevant check first.
2. Expand to shared-package, integration, or build checks only when blast radius warrants it.
3. Diagnose from existing output before rerunning a command.
4. Never save tokens by skipping required security, data-integrity, or regression checks.

## Communicate Concisely

- Send updates only when the state, finding, or next action changes.
- Report outcome, important decisions, validation, and unresolved risk.
- Omit raw command transcripts and explanations the user does not need.
