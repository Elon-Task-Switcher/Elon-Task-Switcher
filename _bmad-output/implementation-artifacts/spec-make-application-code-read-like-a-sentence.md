---
title: 'Make application code read like a sentence'
type: 'refactor'
created: '2026-10-29'
status: 'done'
baseline_commit: 'dc653c3a41a039b34761caf4ba0443359f539ee2'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Timer orchestration, settings markup, sound data, and playback are mixed. Vague names and packed expressions make simple features harder to follow.

**Approach:** Review every application source, test, and configuration file. Use explicit English domain names, verb-named functions, and readable formatting. Extract only the settings form and sound catalogue; leave already-readable code alone.

## Boundaries & Constraints

**Always:** Preserve behavior, UI copy/DOM/accessibility, CSS cascade, defaults, validation/coercion, stored JSON keys/fields, statuses, sound IDs/waveforms/timing, notifications, and static deployment. Follow English naming and Ponytail rules. Retain deadline-based timing and synchronous completion independent of audio promises.

**Ask First:** Any behavioral fix, persisted-data migration, UI redesign, additional production-file split, or change to installed tooling.

**Never:** Add dependencies, generic forms, services, state machines, compatibility re-exports, or unrelated features. Leave installed BMAD skills, historical documents, lockfiles, dependencies, generated builds/reports intact. Historical PRD assumptions do not override current behavior.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Persistence | Existing v1 settings/session; missing or malformed JSON | Existing defaults, normalization, and reload behavior remain identical | Existing fallback behavior preserved |
| Deadline | Active work/break, overdue deadline, focus/visibility event | Current transition and interval count occur without waiting for audio | Existing completion guard retained |
| Blocked audio | Persisted running timer at zero, null deadline, unresolved resume promise | Timer advances; visible alert remains usable | Audio never blocks state transition |
| Sound playback | Silent preset, zero volume, unsupported/suspended/shared context | Existing silence, errors, context reuse, and note schedule preserved | Existing messages and browser fallback retained |
| Controls | Start, pause/resume, reset, automatic/manual continuation, break completion | Existing statuses, countdown, cadence, and control availability preserved | No behavioral corrections folded into refactor |

</frozen-after-approval>

## Code Map

- `src/App.tsx` — state/effects, timer transitions, notifications, timer display, project links.
- `src/SettingsPanel.tsx` — explicit settings form, isolated from timer lifecycle.
- `src/timer.ts` — settings/session types, validation, storage, duration conversion, formatting.
- `src/sound.ts` — audio context reuse, synthesis, break ticking.
- `src/soundPresets.ts` — sound catalogue, settings/types, validation without playback dependency.
- `src/App.test.tsx`, `tests/e2e/app.spec.ts` — existing interaction and regression checks.
- `src/timer.test.ts`, `src/sound.test.ts` — added characterization checks, first passed against the pre-refactor code.
- `src/styles.css`, entry point, version, declarations/setup, root configs, HTML, deployment, and public files — inspected supporting files; mostly already simple.

## Tasks & Acceptance

**Execution:**
- [x] `src/App.test.tsx`, `src/timer.test.ts`, `src/sound.test.ts` — preserve assertions; add compact characterization checks for matrix cases, numeric limits, time rounding, note scheduling, and tick cleanup before production changes. Use installed Vitest, no fixtures or new framework.
- [x] `src/timer.ts` — use verb-named helpers (`convertMinutesToMilliseconds`, `createDefaultSession`, `formatRemainingTime`, `clampDurationMinutes`, `clampIntervalsBeforeBreak`) and meaningful storage locals. Expand long expressions. Remove unused `TimerMode` after checking references.
- [x] `src/soundPresets.ts` (new), `src/sound.ts`, `src/timer.ts` — separate catalogue/types/validation from playback; use direct imports. Format presets clearly. Make note units explicit (`delaySeconds`, `durationSeconds`, `waveform`); clarify context-constructor, gain-node, interval/index, and break-playback names. Preserve every audio parameter.
- [x] `src/SettingsPanel.tsx` (new), `src/App.tsx` — extract unchanged settings markup using settings, update-setting, and restore-default props. Keep explicit form controls and direct typed callbacks.
- [x] `src/App.tsx` — clarify `ring`, `pause`, `reset`, `nextCount`, and refs. Simplify completion flow; remove unused `skipBreak` and redundant aliases. Preserve effect order/dependencies, completion guarding, and fire-and-forget audio. No controller hook just to shorten the file.
- [x] `src/App.test.tsx`, `tests/e2e/app.spec.ts`, `vite.config.ts`, `tsconfig.json`, `src/styles.css` — update renamed references, clarify test helper names, expand compressed formatting. Preserve independent expected values, rule order, selectors, configuration, version, and commands. Other reviewed files change only if readability benefits.
- [x] All changed files — verify references/diff; run unit tests, production build, and existing Chromium suite. Distinguish pre-existing failures from regressions.

**Acceptance Criteria:**
- Given changed actions, when reading their names, then verb and domain purpose are clear without paraphrase comments.
- Given settings and sound code, when tracing imports, then each extraction has one responsibility without indirection or cycles.
- Given existing browser data, when running checks, then imports resolve and behavior remains unchanged.
- Given the inventory, when reviewing the diff, then only application code, relevant tests/configuration, and this spec changed; already-readable files stay intact.

## Spec Change Log

## Design Notes

Two production extractions suffice; keep timer persistence together. Preserve browser workarounds. Explain intentional shortcuts only when needed, using `ponytail:` with known ceiling and upgrade path; no comments narrating obvious code.

## Verification

- `npm test` — existing and characterization tests pass.
- `npm run build` — strict TypeScript and static production build pass.
- `npm run test:e2e` — existing Chromium scenarios pass.
- `git diff --check` — no whitespace errors; inspect diff for persisted fields, UI/DOM/CSS changes, and altered audio numbers.

### Implementation results

- Before production edits: 21/21 characterization and existing tests passed with the threads override.
- After refactor: `npm test` passed 21/21; the initial baseline worker timeout did not recur.
- `npm run test:e2e` passed all 6 Chromium scenarios without browser downloads.
- `npm run build` passed; `git diff --check` passed.
- Baseline comparisons confirmed CSS whitespace-only changes, identical TypeScript configuration values, and every sound preset/note unchanged after reversing internal field renames.

- Final independent blind, edge-case, and acceptance reviews found no actionable introduced defects.
- Primary rerun confirmed 21/21 unit tests, 6/6 Chromium scenarios, production build, and diff checks.

## Suggested Review Order

**Timer orchestration**

- Start here: state remains local; actions use explicit timer-domain names.
  [`App.tsx:71`](../../src/App.tsx#L71)

- Automatic work restart is shared without changing synchronous completion or audio ordering.
  [`App.tsx:193`](../../src/App.tsx#L193)

**Settings and sound responsibilities**

- Settings markup moves intact behind three direct props.
  [`SettingsPanel.tsx:10`](../../src/SettingsPanel.tsx#L10)

- Catalogue separates data from playback; note timing units become explicit.
  [`soundPresets.ts:55`](../../src/soundPresets.ts#L55)

- Audio context reuse and browser fallback stay unchanged with clearer names.
  [`sound.ts:28`](../../src/sound.ts#L28)

- Storage schemas and deadline restoration remain unchanged.
  [`timer.ts:103`](../../src/timer.ts#L103)

**Checks and peripherals**

- Characterization checks protect normalization, storage, deadlines, and displayed time.
  [`timer.test.ts:18`](../../src/timer.test.ts#L18)

- Audio checks protect silence, blocked playback, exact scheduling, and tick cleanup.
  [`sound.test.ts:48`](../../src/sound.test.ts#L48)

- Browser helpers describe their purpose; existing scenarios retain independent assertions.
  [`app.spec.ts:21`](../../tests/e2e/app.spec.ts#L21)

- Formatting expands compressed rules without changing values or cascade order.
  [`styles.css:1`](../../src/styles.css#L1)

- Configuration receives readable indentation only.
  [`tsconfig.json:1`](../../tsconfig.json#L1)
