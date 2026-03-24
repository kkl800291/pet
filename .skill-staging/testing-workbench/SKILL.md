---
name: testing-workbench
description: Use when the task is to test, verify, QA, regression-check, smoke-test, or bug-reproduce a full-stack application. Covers API checks, browser flows, evidence capture, release blocking findings, and concise pass/fail reporting.
---

# Testing Workbench

Use this skill for full-stack verification work across backend APIs, browser UI flows, and release-readiness checks.

## When to use

- User asks to test a feature, flow, release, or fix
- User wants smoke tests, regression checks, QA, or bug reproduction
- You need evidence from both API and UI layers
- You need a release-style pass/fail summary instead of just ad hoc clicking

## Core workflow

1. Define the test surface from actual changed or relevant behavior.
2. Check service availability first:
   - backend health / readiness
   - frontend reachable
3. Run API verification for the key route contracts before UI testing.
4. Run browser verification for the critical user path.
5. Capture evidence:
   - API responses
   - screenshots
   - console errors
   - exact failing step
6. Report only high-signal results:
   - passed scenarios
   - failed scenarios
   - suspected regressions
   - release blockers vs non-blockers

## Default expectations

- Prefer testing the smallest complete user flow that proves the feature works end to end.
- Prefer real browser checks over DOM-only assumptions.
- Prefer direct API validation for stateful backend actions.
- Reproduce before diagnosing when a bug is reported.
- If a flow depends on data setup, create the smallest setup required.

## Recommended tools

- `playwright` for browser automation and evidence capture
- `playwright-interactive` for iterative UI debugging
- `curl` for direct API verification
- project build/test commands when they do not mutate tracked files

## Reporting format

Keep the result concise and decision-oriented:

- `Passed`
- `Failed`
- `Blocked`

For each failed or blocked item include:

- exact step
- observed behavior
- expected behavior
- strongest evidence available

## Release gate rule

Treat these as blockers unless the user explicitly accepts them:

- backend route returns wrong status or payload shape
- primary user flow cannot complete
- action appears successful in UI but backend state does not change
- destructive or moderation actions lack clear confirmation or reason capture
- repeated console/runtime errors during the core flow

## References

- Full checklist: `references/checklist.md`
- Suggested evidence templates: `references/evidence.md`
