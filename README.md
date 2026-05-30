# Elon Task Switcher

Open-source browser timer for people who want to rotate tasks in short focused loops.

The default workflow is inspired by the widely repeated idea that Elon Musk's calendar has been described as divided into short five-minute blocks. The project treats that as inspiration, not as a verified biography claim: some sources repeat the five-minute time-blocking story, while others argue the claim is poorly sourced or mythologized.

## What it does

- Runs a short task-switching timer.
- Defaults to a 5-minute work loop.
- Plays a longer, louder reminder sound when a loop ends.
- Auto-starts the next task loop by default.
- Tracks completed intervals toward a break.
- Prompts for a break after the configured cadence.
- Persists settings and session state across refreshes.
- Runs fully client-side with no backend, account, or cloud sync.

## Why this exists

Generic timer apps work, but they are not dedicated to rapid task switching. Elon Task Switcher is a tiny tool for one specific habit: keep moving through task loops without manually rebuilding the timer every time.

## Research notes

The “Elon Musk five-minute rule” is commonly discussed as a time-blocking variant:

- World Economic Forum reported that Bill Gates and Elon Musk are said to divide schedules into five-minute slots.
- Entrepreneur published an experiment running a day in five-minute slots “like Elon Musk.”
- Dr Amina Yonis has a video, “Elon Musk's 5 Minute Time Management Method | Does Time Blocking Work?”, discussing the method and practical tradeoffs.
- Xataka argues in Spanish that the recurring five-minute-rule claim is likely a myth or at least not well supported.

Useful links:

- World Economic Forum: https://www.weforum.org/stories/2018/02/bill-gates-and-elon-musk-share-a-daily-scheduling-habit-that-helps-them-tackle-their-busy-routines/
- Entrepreneur experiment: https://www.entrepreneur.com/living/i-ran-my-day-like-elon-musk-runs-his-and-this-is-what/312193
- Video summary / YouTube reference: https://glasp.co/youtube/k5N4sPcz_rk
- Skeptical source: https://www.xataka.com/otros/regla-cinco-minutos-bulo-recurrente-que-elon-musk-nunca-ha-usado-porque-no-funciona

## MVP features

- 5-minute default work loop
- Auto-start next task loop enabled by default
- Audible reminder
- Pause/resume/reset
- Break prompt after 12 completed intervals by default
- Configurable work duration, break duration, and break cadence
- Local settings persistence
- Session persistence after refresh
- Static build for free hosting

## Local development

```powershell
npm install
npm run dev
```

Open:

```text
http://localhost:5173/
```

## Test

```powershell
npm test
```

End-to-end browser tests:

```powershell
npx playwright install chromium
npm run test:e2e
```

## Build

```powershell
npm run build
```

The production build is generated in `dist/`.

## Deploy to GitHub Pages

GitHub Actions deploys the app automatically from `main` using `.github/workflows/deploy-pages.yml`.

Manual local check:

```powershell
npm run build
npm run preview
```

## License choice

This project uses the MIT License.

Why MIT:

- simple and widely understood
- friendly to open-source reuse
- allows personal, educational, and commercial use
- low friction for contributors and forks

If the project later needs stronger copyleft requirements, GPL-3.0 can be reconsidered. For this small open-source utility, MIT is the most practical default.
