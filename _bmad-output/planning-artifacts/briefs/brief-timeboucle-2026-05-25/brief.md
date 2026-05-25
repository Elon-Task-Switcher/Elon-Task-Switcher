---
title: TimeBoucle Product Brief
status: draft
created: 2026-05-25
updated: 2026-05-25
---

# TimeBoucle Product Brief

## 1. Product Summary

TimeBoucle is a lightweight web app that helps the user rotate tasks on a fixed short cadence, starting with 5-minute work loops. At the end of each loop, the app plays a sound to remind the user to switch tasks. It also supports periodic breaks, such as a 5-minute pause every hour. The first version should be simple, fast to build, open source, and deployable on free static hosting such as GitHub Pages.

## 2. Origin and Motivation

The idea is inspired by the practice of switching between tasks at short intervals, associated by the user with Elon Musk's highly segmented time management style. The current workaround is a generic mobile timer, but it is not flexible or dedicated to the task-switching workflow. TimeBoucle should turn this timer pattern into a purpose-built tool.

## 3. Target User

Primary user:
- The project creator, who wants a focused tool for personal task switching.

Secondary users:
- Open-source users interested in time blocking, task rotation, ADHD-friendly workflows, productivity experiments, or lightweight Pomodoro alternatives. [ASSUMPTION]

## 4. Problem

Generic timer apps can count down time, but they do not model the full workflow:
- repeated short task-switch cycles
- audible transition reminders
- automatic break cycles
- simple configuration for work duration and break cadence
- fast browser access without installing a mobile app

This creates friction and makes the method harder to maintain consistently.

## 5. MVP Goal

Build a usable browser-based timer today that supports the core TimeBoucle loop:

1. Configure work interval duration, default 5 minutes.
2. Start, pause, resume, and reset the loop.
3. Play a sound when the interval ends.
4. Count completed intervals.
5. Trigger a break after a configurable number of intervals, default 12 intervals = 1 hour.
6. Configure break duration, default 5 minutes.
7. Run fully client-side.
8. Deploy easily to GitHub Pages or another free static host.
9. Be open source from the beginning.

## 6. Non-Goals for MVP

The MVP should not include:
- user accounts
- cloud sync
- payments
- backend server
- database
- complex analytics
- native mobile app
- desktop app
- team collaboration
- calendar integration
- AI features

These can be reconsidered only after the first working version exists.

## 7. Suggested Platform Strategy

Phase 1: Static web app
- Fastest route.
- Works on desktop and mobile browsers.
- Deployable on GitHub Pages.
- No backend cost.

Phase 2: Progressive Web App (PWA) [ASSUMPTION]
- Installable on mobile/desktop.
- Better offline behavior.
- More app-like experience.

Phase 3: Native wrappers only if needed [ASSUMPTION]
- Tauri/Electron for desktop or Capacitor for mobile should wait until the browser version proves useful.

## 8. Core UX

The app should feel like a dedicated control panel for task rotation:

- Big visible countdown.
- Clear current mode: Work or Break.
- Clear next action: switch task, continue break, resume work.
- Minimal controls: Start, Pause, Reset.
- Small settings panel for durations and break cadence.
- Sound test option. [ASSUMPTION]
- Optional task label for the current loop. [ASSUMPTION]

## 9. Success Criteria

The MVP succeeds if:

- The user can run a 5-minute loop without using a mobile timer.
- The sound reliably signals the end of each interval.
- Breaks are automatically suggested or started after one hour.
- The app can be deployed publicly as an open-source project.
- The first useful version can be built and tested today.

## 10. Open Questions

1. Should breaks start automatically, or should the app ask for confirmation before starting a break?
2. Should the task switch be manual only, or should the app maintain a small list of tasks to rotate through?
3. Should the sound be built-in only, or should users upload/select custom sounds?
4. Should settings persist in local storage?
5. Should the timer keep running accurately when the browser tab is inactive?

## 11. Recommended Next Step

Use a lightweight Agile path:

1. Convert this brief into a minimal PRD.
2. Generate epics and user stories.
3. Plan a first sprint focused only on the MVP timer loop.
4. Implement with a static frontend stack.

Recommended technical default for speed: Vite + React + TypeScript, deployed to GitHub Pages. [ASSUMPTION]
