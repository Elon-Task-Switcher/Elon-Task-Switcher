---
title: TimeBoucle PRD
status: draft
created: 2026-05-25
updated: 2026-05-25
source_brief: ../briefs/brief-timeboucle-2026-05-25/brief.md
---

# TimeBoucle PRD

## 1. Purpose

TimeBoucle is a lightweight, open-source web application that helps a user switch tasks at short fixed intervals. The MVP focuses on a 5-minute work loop, audible reminders, and a 5-minute break after one hour of completed loops.

The first release must be simple enough to build and deploy today as a static web app.

## 2. Goals

- Provide a dedicated timer for short task-switching loops.
- Make the end of each loop obvious with sound and visual state.
- Support recurring breaks after a configurable number of loops.
- Run fully in the browser without backend, login, or cloud dependency.
- Be deployable on GitHub Pages or similar free static hosting.
- Preserve open-source readiness from the first commit.

## 3. Non-Goals

- User accounts.
- Cloud sync.
- Backend server.
- Database.
- Payments.
- Native mobile app.
- Desktop app.
- Team collaboration.
- Calendar integration.
- AI recommendations.
- Complex productivity analytics.

## 4. Users

### Primary Persona: Solo Task Switcher

The first user is the project creator. They want a simple browser tool to replace a generic mobile timer and support a personal task-switching workflow.

Needs:
- Start a work loop quickly.
- Hear when 5 minutes are over.
- Know when to take a break.
- Avoid configuration complexity.
- Use the app on free/open tooling.

### Secondary Persona: Open-Source Productivity User [ASSUMPTION]

A future user discovers the project on GitHub and wants a lightweight alternative to Pomodoro timers.

Needs:
- Clear README and deploy link.
- Simple settings.
- No account required.
- Works on desktop and mobile browsers.

## 5. User Journey

### UJ-1: Run a task-switching session

1. User opens TimeBoucle in the browser.
2. App shows default settings: 5-minute work interval, break after 12 intervals, 5-minute break.
3. User clicks Start.
4. App counts down the current work interval.
5. When time ends, app plays a sound and shows a clear “Switch task” state.
6. User switches task and continues.
7. After 12 completed work intervals, app prompts a 5-minute break. [ASSUMPTION]
8. User starts the break.
9. Break timer ends with sound.
10. User resumes work loops.

## 6. Functional Requirements

### Capability A: Timer Loop

- FR-1: The app shall display a countdown timer for the current mode.
- FR-2: The app shall support Work mode and Break mode.
- FR-3: The default Work duration shall be 5 minutes.
- FR-4: The default Break duration shall be 5 minutes.
- FR-5: The user shall be able to start the timer.
- FR-6: The user shall be able to pause the timer.
- FR-7: The user shall be able to resume the timer.
- FR-8: The user shall be able to reset the timer.
- FR-9: The app shall count completed work intervals.

### Capability B: Audio Reminder

- FR-10: The app shall play an audible sound when a work interval ends.
- FR-11: The app shall play an audible sound when a break ends.
- FR-12: The app shall provide a Test Sound control. [ASSUMPTION]
- FR-13: If browser audio playback is blocked, the app shall explain that the user must interact with the page before sound can play. [ASSUMPTION]

### Capability C: Break Cadence

- FR-14: The app shall trigger a break after a configurable number of completed work intervals.
- FR-15: The default break cadence shall be 12 work intervals.
- FR-16: When the break cadence is reached, the app shall prompt the user to start the break rather than starting it automatically. [ASSUMPTION]
- FR-17: The app shall reset the break cadence counter after a completed break.
- FR-18: The user shall be able to skip a prompted break. [ASSUMPTION]

### Capability D: Settings

- FR-19: The user shall be able to configure Work duration in minutes.
- FR-20: The user shall be able to configure Break duration in minutes.
- FR-21: The user shall be able to configure intervals before break.
- FR-22: The app shall persist settings in browser local storage. [ASSUMPTION]
- FR-23: The app shall provide a way to restore default settings. [ASSUMPTION]

### Capability E: Session State

- FR-24: The app shall clearly show whether the user is in Work mode, Break mode, Paused, or Break Due state.
- FR-25: The app shall clearly show the number of completed work intervals in the current cycle.
- FR-26: The app shall show the next expected event, such as “switch task” or “break due”.

### Capability F: Open-Source Delivery

- FR-27: The repository shall include a README with local run and deployment instructions.
- FR-28: The repository shall include an open-source license. [ASSUMPTION: MIT]
- FR-29: The app shall build as static assets suitable for GitHub Pages.

## 7. Non-Functional Requirements

- NFR-1: The MVP shall run fully client-side.
- NFR-2: The MVP shall require no backend services.
- NFR-3: The app shall be usable on modern desktop browsers.
- NFR-4: The app should be usable on mobile browsers. [ASSUMPTION]
- NFR-5: The UI shall remain simple and readable at a glance.
- NFR-6: The app shall avoid unnecessary dependencies.
- NFR-7: The app shall support deployment to GitHub Pages.
- NFR-8: Timer calculations should be based on timestamps rather than only interval ticks, so time remains reasonably accurate when the tab is inactive. [ASSUMPTION]

## 8. UX Requirements

- UX-1: The countdown must be the dominant visual element.
- UX-2: Primary controls must be visible without opening settings.
- UX-3: Settings must not distract from the timer.
- UX-4: State transitions must be obvious through text and color.
- UX-5: The app must not require onboarding to understand.
- UX-6: The app should feel lightweight, focused, and calm. [ASSUMPTION]

## 9. MVP Scope

Included:
- Work/break timer.
- Start/pause/resume/reset.
- Sound notification.
- Configurable durations.
- Configurable break cadence.
- Local settings persistence.
- Completed interval count.
- GitHub Pages-ready build.
- README and license.

Excluded:
- Task list.
- User login.
- Cloud sync.
- Analytics dashboard.
- Custom uploaded sounds.
- Native app packaging.

## 10. Success Metrics

- SM-1: User can complete one full 5-minute work interval and hear the reminder.
- SM-2: User can complete 12 work intervals and reach the break prompt.
- SM-3: User can change durations and have settings persist after reload.
- SM-4: App can be deployed publicly from static build output.
- SM-5: The MVP replaces the user’s current mobile timer workaround for at least one work session.

Counter-metrics:
- CM-1: MVP takes more than one day because of unnecessary features.
- CM-2: App requires login, backend, or deployment complexity.
- CM-3: Timer is visually unclear or audio reminder is unreliable.

## 11. Release Criteria

The MVP is releasable when:

- All MVP functional requirements FR-1 through FR-29 are implemented or explicitly deferred.
- The app builds successfully.
- The app runs locally.
- A sound reminder works after user interaction.
- Settings persist in local storage.
- README explains install, run, build, and deploy.
- License file exists.

## 12. Open Questions

- OQ-1: Confirm break behavior: prompt before break vs automatic start. Current PRD assumes prompt.
- OQ-2: Confirm license. Current PRD assumes MIT.
- OQ-3: Confirm whether a task label is needed in MVP. Current PRD excludes task list and labels.
- OQ-4: Confirm visual style preference.
- OQ-5: Confirm whether deployment target is GitHub Pages first.

## 13. Recommended Technical Direction

This PRD does not require a specific implementation, but the fastest likely stack is:

- Vite
- React
- TypeScript
- CSS modules or simple CSS
- Web Audio API or bundled short audio asset
- localStorage
- GitHub Pages deployment

Implementation details belong in architecture or sprint planning, not product scope.
