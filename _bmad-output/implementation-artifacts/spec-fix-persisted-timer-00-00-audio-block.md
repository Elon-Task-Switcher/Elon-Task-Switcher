---
title: 'Fix persisted timer 00:00 audio block'
type: 'bugfix'
created: '2026-06-09'
status: 'done'
route: 'one-shot'
context: []
---

# Fix persisted timer 00:00 audio block

## Intent

**Problem:** On the deployed GitHub Pages app, a persisted running session can reopen or complete at `00:00` and remain stuck when browser audio is blocked after inactivity. Users then have to delete `localStorage` manually, and new tabs inherit the same broken persisted state.

**Approach:** Make timer completion advance synchronously before any reminder audio resolves, and reset the completion guard during manual reset. Add a regression test for a persisted `running + 00:00 + null deadline` session with a hanging `AudioContext`.

## Suggested Review Order

**Completion state machine**

- Timer state no longer waits on browser audio before advancing.
  [`App.tsx:170`](../../src/App.tsx#L170)

- Completion guard releases synchronously after state transition scheduling.
  [`App.tsx:216`](../../src/App.tsx#L216)

- Manual reset clears any stale completion guard.
  [`App.tsx:245`](../../src/App.tsx#L245)

**Regression coverage**

- Test imports storage keys instead of duplicating magic strings.
  [`App.test.tsx:5`](../../src/App.test.tsx#L5)

- Test reproduces persisted `00:00` session plus blocked audio.
  [`App.test.tsx:132`](../../src/App.test.tsx#L132)
