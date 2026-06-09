---
title: 'Reduce audio blocking and expose app version'
type: 'feature'
created: '2026-06-09'
status: 'done'
route: 'one-shot'
context: []
---

# Reduce audio blocking and expose app version

## Intent

**Problem:** Browser audio can still be blocked by autoplay policies when the timer reminder fires after inactivity. The deployed app also lacked a visible version, making it harder to confirm which GitHub Pages build is active.

**Approach:** Reuse one shared `AudioContext` and attempt to unlock it from user gestures (`Start`, break tick test) before timer completion. Use `package.json` as the single version source, inject it into the app at build time, show it in the interface, and add semver bump scripts.

## Suggested Review Order

**Audio unlock flow**

- Shared context keeps browser-granted audio alive across reminders.
  [`sound.ts:89`](../../src/sound.ts#L89)

- Public unlock helper lets user gestures prepare sound early.
  [`sound.ts:141`](../../src/sound.ts#L141)

- Start button attempts audio unlock before timer end.
  [`App.tsx:149`](../../src/App.tsx#L149)

- Start and break-tick controls trigger the unlock path.
  [`App.tsx:235`](../../src/App.tsx#L235)

**Versioning**

- Package semver bumped to the visible release number.
  [`package.json:3`](../../package.json#L3)

- Version bump scripts support incremental patch/minor/major updates.
  [`package.json:14`](../../package.json#L14)

- Vite injects package version as a compile-time constant.
  [`vite.config.ts:5`](../../vite.config.ts#L5)

- UI displays the injected app version.
  [`App.tsx:395`](../../src/App.tsx#L395)

**Regression coverage**

- Unit test confirms version text follows package metadata.
  [`App.test.tsx:25`](../../src/App.test.tsx#L25)

- Unit test confirms one `AudioContext` is reused after start.
  [`App.test.tsx:177`](../../src/App.test.tsx#L177)

- E2E test confirms version appears in the deployed UI path.
  [`app.spec.ts:57`](../../tests/e2e/app.spec.ts#L57)
