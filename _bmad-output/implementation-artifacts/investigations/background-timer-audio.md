# Investigation: background timer audio behavior

## Hand-off Brief
The timer is wall-clock based and should catch up after Chrome delays background timers. The sound is event-loop/Web Audio based and can be delayed until Chrome lets the hidden tab run again or until the tab becomes visible. Root cause is browser background throttling plus current app only firing `playReminderSound()` from a throttled `setInterval` completion path.

## Case Info
- Date: 2026-05-26
- Slug: background-timer-audio
- Status: Concluded
- Input: User reports sound sometimes does not play while app is backgrounded/change tab; sound plays when returning; timer reliability uncertain.
- BMad activation note: `python3` command unavailable in this environment, so case file created manually following investigate evidence rules.

## Problem Statement
When the app tab is in background, the user expects the timer completion cue to happen on time. Observed symptom: audio cue may not play until the user returns to the tab. Need determine whether timer itself is wrong, or only audible notification is delayed.

## Evidence Inventory
| Evidence | Grade | Notes |
|---|---|---|
| `src/App.tsx:93-103` | Confirmed | Running timer uses `setInterval(..., 250)` but computes remaining from `deadlineRef.current - Date.now()` instead of subtracting ticks. |
| `src/App.tsx:120-150` | Confirmed | Completion handler awaits `ring()`, then advances interval / auto-starts next work loop. |
| `src/timer.ts:92-99` | Confirmed | Session reload computes remaining from persisted deadline and current `Date.now()`. |
| `src/sound.ts:87-92`, `src/sound.ts:121-130` | Confirmed | Reminder sound creates/resumes `AudioContext` only when completion path runs, then schedules oscillator tones. |
| Chrome docs background timer policy | Confirmed | Chrome throttles background tab timers; hidden pages can be checked once per second or once per minute after intensive throttling conditions. |
| Chrome Codex visible test | Confirmed | In visible tab with 0.05-min interval, app completed cycles and displayed alert (`Completed intervals: 2 / 11`) after wait. |
| True audio output in hidden tab | Missing | Browser automation cannot directly confirm speaker output timing. Need manual run with tab hidden and timestamp logging/audio event instrumentation. |

## Hypotheses
### H1: Timer is inaccurate in background
- Status: Mostly refuted for elapsed-time correctness.
- Evidence: `src/App.tsx:96` uses absolute wall clock; `src/timer.ts:95-96` recomputes from deadline on reload/restore.
- Remaining risk: UI update and completion callback are still scheduled by throttled `setInterval`, so completion side effects can be late even if remaining time math catches up.

### H2: Sound is delayed because completion callback is delayed in hidden tab
- Status: Confirmed by mechanism, not by direct audio capture.
- Evidence chain: completion depends on `setInterval` firing (`src/App.tsx:95-103`); Chrome throttles hidden page timers; sound only starts inside completion path (`src/App.tsx:120-122`, `src/sound.ts:121-130`). Therefore if Chrome delays the interval, the sound starts late.

### H3: Web Audio itself may be suspended/resumed depending on tab/user activation
- Status: Open.
- Evidence: app creates/resumes `AudioContext` at sound time (`src/sound.ts:87-92`). User reports sound plays on returning. Need instrumentation of `AudioContext.state`, `visibilitychange`, and completion timestamp to confirm.

## Source Code Trace
- Trigger: Work timer started (`startWork`) sets `deadlineRef.current = Date.now() + nextRemaining` in `src/App.tsx:161`.
- Scheduler: `setInterval` checks every 250ms in `src/App.tsx:95-103`.
- Completion: When remaining <= 0, `handleTimerComplete(status)` runs.
- Sound: `handleTimerComplete` calls `await ring()` at `src/App.tsx:121`; `ring` calls `playReminderSound(settings)` at `src/App.tsx:110-112`.
- Audio: `playReminderSound` creates/resumes an `AudioContext` and schedules tones in `src/sound.ts:121-130`.
- Auto-loop: After sound, work interval auto-restarts at `src/App.tsx:145-150` when `autoStartNextWork` is enabled.

## Confirmed Findings
1. Timer display/math is designed to use absolute deadlines, not tick counting. This protects elapsed-time correctness when ticks are delayed.
2. Completion side effects are not deadline-scheduled outside page timers. They require the hidden tab's JavaScript callback to run.
3. Browser background policies can delay hidden tab timers; Chrome documentation explicitly describes throttling hidden page JavaScript timers.
4. The app has no `visibilitychange` reconciliation path and no Notification API fallback.

## Deduced Conclusion
Confidence: Medium-High.
The user's symptom is likely real: the timer deadline is conceptually correct, but the audible cue can be delayed in background because the app waits for a throttled `setInterval` callback before it starts Web Audio. When the user returns to the tab, Chrome allows the page to run promptly, so the completion path and sound can fire then.

## Missing Evidence
- Direct hidden-tab audio timestamp: record `Date.now()` when deadline passes, when `handleTimerComplete` runs, when `AudioContext` resumes, and when sound is scheduled.
- Browser-specific variation: test normal Chrome vs Codex in-app Chrome vs mobile Chrome.
- Permission state: inspect whether autoplay/audio engagement or suspended AudioContext changes behavior.

## Fix Direction
Recommended next workflow: `bmad-quick-dev`.

Implement:
1. Add `document.visibilitychange` handler that immediately reconciles overdue deadlines on return.
2. Store `lastCompletedDeadline` / guard against double completion.
3. Add optional Browser Notification fallback for background completion (`Notification.requestPermission`, then `new Notification(...)`).
4. Add diagnostic logging in dev mode or tests for deadline/completion delay.
5. Keep visual card flash as foreground cue; do not rely on sound alone.

## Reproduction Plan
1. Set work duration to 0.05 minute.
2. Start timer.
3. Switch to another tab for 10+ seconds.
4. Return to app.
5. Observe whether sound fires on return and whether completed interval count advanced.
6. Repeat after 5+ minutes hidden to trigger more aggressive Chrome throttling.

## External References
- Chrome background tabs policy: https://developer.chrome.com/blog/background_tabs
- Chrome 88 timer throttling: https://developer.chrome.com/blog/timer-throttling-in-chrome-88/
- Chrome enterprise intensive wake-up throttling policy: https://chromeenterprise.google/policies/intensive-wake-up-throttling-enabled/
