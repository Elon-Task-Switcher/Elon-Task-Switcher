# Elon Task Switcher

Open-source task-switching timer for short work loops.

## MVP

- 5-minute default work loop
- audible reminder
- pause/resume/reset
- break prompt after 12 completed intervals
- configurable durations and cadence
- local settings persistence
- static build for free hosting

## Local development

```powershell
npm install
npm run dev
```

## Test

```powershell
npm test
```

## Build

```powershell
npm run build
```

The build output is generated in `dist/` and can be deployed to GitHub Pages or any static host.

## Deploy to GitHub Pages

1. Run `npm run build`.
2. Publish the `dist/` folder with your preferred GitHub Pages workflow.
3. Vite is configured with `base: './'` so static assets work from project pages.

## License

MIT.
