---
title: 'Improve background timer completion handling'
type: 'bugfix'
created: '2026-05-26'
status: 'done'
route: 'one-shot'
---

# Improve background timer completion handling

## Intent

**Problem:** Chrome can throttle hidden-tab timers, so the task-switch sound and completion effects may run late or only when the user returns to the app tab.

**Approach:** Reconcile overdue deadlines on `visibilitychange` and window focus, guard against duplicate completion, and request/show browser notifications when completion occurs while the page is hidden. Preserve the existing sound and red-card visual cue for foreground/return-to-tab feedback.

## Suggested Review Order

1. [`../../src/App.tsx`](../../src/App.tsx) — verify overdue-deadline catch-up, duplicate-completion guard, and notification behavior.
2. [`../../src/App.test.tsx`](../../src/App.test.tsx) — verify regression coverage for missed timer callbacks and temporary visual alert.
3. [`background-timer-audio.md`](investigations/background-timer-audio.md) — review investigation evidence and browser-throttling diagnosis.
