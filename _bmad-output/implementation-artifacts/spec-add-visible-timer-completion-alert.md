---
title: 'Add visible timer completion alert'
type: 'feature'
created: '2026-05-26'
status: 'done'
route: 'one-shot'
---

# Add visible timer completion alert

## Intent

**Problem:** Users who mute audio can miss the 5-minute task-switch cue, especially when auto-start immediately begins the next work loop.

**Approach:** Add a persistent high-contrast visual alert when a work interval completes. Keep the alert visible across auto-started work loops until the user dismisses it, starts manually, resets, or moves to the next loop.

## Suggested Review Order

1. [`../../src/App.tsx`](../../src/App.tsx) — verify completion state, dismiss behavior, and auto-start persistence.
2. [`../../src/styles.css`](../../src/styles.css) — verify visual prominence, reduced-motion handling, and ended countdown styling.
3. [`../../src/App.test.tsx`](../../src/App.test.tsx) — verify regression coverage for auto-start completion alerts.
