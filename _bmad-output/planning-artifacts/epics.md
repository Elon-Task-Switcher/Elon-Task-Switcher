---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
inputDocuments:
  - "D:\Projets\Perso\timeboucle\_bmad-output\planning-artifacts\prds\prd-timeboucle-2026-05-25\prd.md"
---

# timeboucle - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for timeboucle, decomposing the requirements from the PRD into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: The app shall display a countdown timer for the current mode.
FR2: The app shall support Work mode and Break mode.
FR3: The default Work duration shall be 5 minutes.
FR4: The default Break duration shall be 5 minutes.
FR5: The user shall be able to start the timer.
FR6: The user shall be able to pause the timer.
FR7: The user shall be able to resume the timer.
FR8: The user shall be able to reset the timer.
FR9: The app shall count completed work intervals.
FR10: The app shall play an audible sound when a work interval ends.
FR11: The app shall play an audible sound when a break ends.
FR12: The app shall provide a Test Sound control.
FR13: If browser audio playback is blocked, the app shall explain that the user must interact with the page before sound can play.
FR14: The app shall trigger a break after a configurable number of completed work intervals.
FR15: The default break cadence shall be 12 work intervals.
FR16: When the break cadence is reached, the app shall prompt the user to start the break rather than starting it automatically.
FR17: The app shall reset the break cadence counter after a completed break.
FR18: The user shall be able to skip a prompted break.
FR19: The user shall be able to configure Work duration in minutes.
FR20: The user shall be able to configure Break duration in minutes.
FR21: The user shall be able to configure intervals before break.
FR22: The app shall persist settings in browser local storage.
FR23: The app shall provide a way to restore default settings.
FR24: The app shall clearly show whether the user is in Work mode, Break mode, Paused, or Break Due state.
FR25: The app shall clearly show the number of completed work intervals in the current cycle.
FR26: The app shall show the next expected event, such as “switch task” or “break due”.
FR27: The repository shall include a README with local run and deployment instructions.
FR28: The repository shall include an open-source license.
FR29: The app shall build as static assets suitable for GitHub Pages.

### NonFunctional Requirements

NFR1: The MVP shall run fully client-side.
NFR2: The MVP shall require no backend services.
NFR3: The app shall be usable on modern desktop browsers.
NFR4: The app should be usable on mobile browsers.
NFR5: The UI shall remain simple and readable at a glance.
NFR6: The app shall avoid unnecessary dependencies.
NFR7: The app shall support deployment to GitHub Pages.
NFR8: Timer calculations should be based on timestamps rather than only interval ticks, so time remains reasonably accurate when the tab is inactive.

### Additional Requirements

- No Architecture document exists yet; technical decomposition must stay lightweight and implementation-ready.
- Recommended technical direction from PRD addendum: Vite + React + TypeScript.
- Use localStorage for settings persistence.
- Use timestamp-based timer calculations to reduce drift in inactive tabs.
- Use Web Audio API or bundled short audio asset for reminders.
- Prepare static build suitable for GitHub Pages.
- Include README and MIT license unless changed by user.

### UX Design Requirements

UX-DR1: The countdown must be the dominant visual element.
UX-DR2: Primary controls must be visible without opening settings.
UX-DR3: Settings must not distract from the timer.
UX-DR4: State transitions must be obvious through text and color.
UX-DR5: The app must not require onboarding to understand.
UX-DR6: The app should feel lightweight, focused, and calm.
UX-DR7: The UI must clearly show current mode, next expected event, and completed intervals.

### FR Coverage Map

FR1: Epic 1 - Countdown timer display.
FR2: Epic 1 - Work and Break mode support foundation.
FR3: Epic 1 - Default Work duration.
FR4: Epic 3 - Default Break duration.
FR5: Epic 1 - Start timer.
FR6: Epic 1 - Pause timer.
FR7: Epic 1 - Resume timer.
FR8: Epic 1 - Reset timer.
FR9: Epic 3 - Completed work interval count.
FR10: Epic 2 - Work interval end sound.
FR11: Epic 3 - Break end sound.
FR12: Epic 2 - Test Sound control.
FR13: Epic 2 - Browser audio blocked explanation.
FR14: Epic 3 - Break after configurable completed intervals.
FR15: Epic 3 - Default 12 intervals before break.
FR16: Epic 3 - Prompt before starting break.
FR17: Epic 3 - Reset break cadence counter after break.
FR18: Epic 3 - Skip prompted break.
FR19: Epic 4 - Configure Work duration.
FR20: Epic 4 - Configure Break duration.
FR21: Epic 4 - Configure intervals before break.
FR22: Epic 4 - Persist settings in localStorage.
FR23: Epic 4 - Restore default settings.
FR24: Epic 1 - Show Work, Break, Paused, Break Due states.
FR25: Epic 3 - Show completed intervals in current cycle.
FR26: Epic 1/Epic 2 - Show next expected event and switch-task state.
FR27: Epic 4 - README with local run and deployment instructions.
FR28: Epic 4 - Open-source license.
FR29: Epic 4 - Static build suitable for GitHub Pages.

## Epic List

### Epic 1: Timer de base utilisable
Utilisateur peut lancer une boucle de travail simple avec countdown clair.
**FRs covered:** FR1, FR2, FR3, FR5, FR6, FR7, FR8, FR24, FR26

### Epic 2: Rappel sonore et transition de tâche
Utilisateur entend la fin du cycle et sait qu’il doit switcher.
**FRs covered:** FR10, FR12, FR13, FR26

### Epic 3: Pauses cycliques et compteur de session
Utilisateur voit ses cycles complétés et reçoit une pause après 1h.
**FRs covered:** FR4, FR9, FR11, FR14, FR15, FR16, FR17, FR18, FR25

### Epic 4: Configuration, persistance et livraison open-source
Utilisateur peut ajuster durées/cadence, retrouver ses réglages, et le projet est publiable.
**FRs covered:** FR19, FR20, FR21, FR22, FR23, FR27, FR28, FR29


## Epic 1: Timer de base utilisable

Utilisateur peut lancer une boucle de travail simple avec countdown clair.

### Story 1.1: Afficher le timer par défaut

As a solo task switcher,
I want to see a clear 5-minute work timer,
So that I can immediately understand the current loop.

**Acceptance Criteria:**

**Given** I open the app
**When** the app loads
**Then** I see a countdown set to 05:00
**And** the current mode is shown as Work
**And** the countdown is the dominant visual element
**And** the next expected event indicates task switch at timer end

### Story 1.2: Démarrer le timer

As a solo task switcher,
I want to start the timer,
So that I can begin a work loop.

**Acceptance Criteria:**

**Given** the timer is idle at 05:00
**When** I click Start
**Then** the countdown begins decreasing
**And** the state changes to running Work mode
**And** the Start action is no longer the primary action

### Story 1.3: Mettre en pause et reprendre

As a solo task switcher,
I want to pause and resume the timer,
So that I can handle interruptions without losing the session.

**Acceptance Criteria:**

**Given** the timer is running
**When** I click Pause
**Then** the countdown stops decreasing
**And** the state shows Paused
**When** I click Resume
**Then** the countdown continues from the paused remaining time
**And** the state returns to running Work mode

### Story 1.4: Réinitialiser le timer

As a solo task switcher,
I want to reset the timer,
So that I can restart the current loop cleanly.

**Acceptance Criteria:**

**Given** the timer is running or paused
**When** I click Reset
**Then** the timer returns to 05:00
**And** the state returns to idle Work mode
**And** no completed interval is added

### Story 1.5: Afficher clairement les états et la prochaine action

As a solo task switcher,
I want the app to clearly show what is happening and what comes next,
So that I do not need to interpret the timer manually.

**Acceptance Criteria:**

**Given** the app is idle, running, paused, or ended
**When** the state changes
**Then** the UI shows the current state clearly
**And** the UI shows the next expected event
**And** state changes are visible through text and color
**And** the app remains understandable without onboarding

## Epic 2: Rappel sonore et transition de tâche

Utilisateur entend la fin du cycle et sait qu’il doit switcher.

### Story 2.1: Jouer un son à la fin du cycle de travail

As a solo task switcher,
I want to hear a sound when the work interval ends,
So that I know it is time to switch tasks.

**Acceptance Criteria:**

**Given** the Work timer is running
**When** the countdown reaches zero
**Then** the app plays an audible reminder sound
**And** the UI shows that the work interval ended
**And** the next expected event tells me to switch task

### Story 2.2: Tester le son manuellement

As a solo task switcher,
I want to test the reminder sound,
So that I can confirm audio works before starting a session.

**Acceptance Criteria:**

**Given** the app is open
**When** I click Test Sound
**Then** the app plays the reminder sound
**And** no timer state changes
**And** no completed interval is added

### Story 2.3: Gérer le blocage audio navigateur

As a solo task switcher,
I want clear feedback if the browser blocks audio,
So that I know how to enable sound reminders.

**Acceptance Criteria:**

**Given** the browser blocks audio playback
**When** the app tries to play a reminder sound
**Then** the app shows a clear message explaining that user interaction may be required
**And** the message suggests using Test Sound or clicking the page
**And** the timer state remains valid

### Story 2.4: Afficher l’état “switch task”

As a solo task switcher,
I want the app to visibly show that I should switch tasks,
So that I do not rely only on sound.

**Acceptance Criteria:**

**Given** a work interval has ended
**When** the sound reminder plays
**Then** the UI enters a clear Switch Task state
**And** the state is visible through text and color
**And** I can continue to the next work loop from that state

## Epic 3: Pauses cycliques et compteur de session

Utilisateur voit ses cycles complétés et reçoit une pause après 1h.

### Story 3.1: Compter les intervalles de travail terminés

As a solo task switcher,
I want completed work intervals to be counted,
So that I know my progress toward the next break.

**Acceptance Criteria:**

**Given** a work interval is running
**When** the countdown reaches zero
**Then** the completed interval count increases by one
**And** the count is visible in the UI
**And** reset behavior does not add a completed interval

### Story 3.2: Détecter quand la pause est due

As a solo task switcher,
I want the app to detect when I have completed enough work intervals,
So that I know when to take a break.

**Acceptance Criteria:**

**Given** the break cadence is 12 intervals
**When** I complete the 12th work interval
**Then** the app enters Break Due state
**And** the UI clearly shows that a break is recommended
**And** the app does not automatically start the break

### Story 3.3: Démarrer et terminer une pause

As a solo task switcher,
I want to start a break when it is due,
So that I can recover before continuing work loops.

**Acceptance Criteria:**

**Given** the app is in Break Due state
**When** I start the break
**Then** the app starts a 5-minute Break timer
**And** the UI shows Break mode
**When** the Break timer reaches zero
**Then** the app plays an audible reminder sound
**And** the app indicates the break is complete

### Story 3.4: Reprendre les cycles après une pause

As a solo task switcher,
I want the break cycle to reset after a completed break,
So that I can start a new one-hour work block.

**Acceptance Criteria:**

**Given** a break has completed
**When** I resume work
**Then** the completed interval count for the break cycle resets to zero
**And** the app returns to Work mode
**And** the next break is due after the configured cadence again

### Story 3.5: Ignorer une pause proposée

As a solo task switcher,
I want to skip a break prompt,
So that I can continue working when I choose.

**Acceptance Criteria:**

**Given** the app is in Break Due state
**When** I choose Skip Break
**Then** the app returns to Work mode
**And** the break cycle counter resets to zero
**And** the UI shows the next expected work interval

## Epic 4: Configuration, persistance et livraison open-source

Utilisateur peut ajuster durées/cadence, retrouver ses réglages, et le projet est publiable.

### Story 4.1: Configurer les durées et cadence

As a solo task switcher,
I want to configure work duration, break duration, and intervals before break,
So that TimeBoucle fits my workflow.

**Acceptance Criteria:**

**Given** the app is open
**When** I update Work duration
**Then** future work timers use the new duration
**And** invalid values are rejected or corrected

**Given** the app is open
**When** I update Break duration
**Then** future break timers use the new duration

**Given** the app is open
**When** I update intervals before break
**Then** future break prompts use the new cadence

### Story 4.2: Sauvegarder les réglages localement

As a solo task switcher,
I want my settings saved in the browser,
So that I do not need to reconfigure TimeBoucle after reload.

**Acceptance Criteria:**

**Given** I change settings
**When** I reload the page
**Then** the app restores my saved settings
**And** no account or backend is required
**And** saved settings use localStorage

### Story 4.3: Restaurer les paramètres par défaut

As a solo task switcher,
I want to restore default settings,
So that I can quickly return to the 5-minute workflow.

**Acceptance Criteria:**

**Given** settings have been changed
**When** I click Restore Defaults
**Then** Work duration returns to 5 minutes
**And** Break duration returns to 5 minutes
**And** intervals before break returns to 12
**And** saved settings are updated

### Story 4.4: Préparer le projet open source

As an open-source user,
I want project documentation and a license,
So that I can run, inspect, and reuse the project.

**Acceptance Criteria:**

**Given** I open the repository
**When** I read the README
**Then** I see project purpose, local run commands, build commands, and deployment notes
**And** the repository includes an open-source license file
**And** the license is MIT unless changed by the owner

### Story 4.5: Produire un build statique déployable

As a project maintainer,
I want the app to build as static assets,
So that I can deploy it to GitHub Pages or another free static host.

**Acceptance Criteria:**

**Given** the app source exists
**When** I run the build command
**Then** static assets are generated successfully
**And** the build requires no backend
**And** the README explains GitHub Pages deployment


