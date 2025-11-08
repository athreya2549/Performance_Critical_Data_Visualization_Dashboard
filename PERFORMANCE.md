# PERFORMANCE

This document records performance testing notes and results for the Performance Dashboard project.

## Quick Results

- Last local run: basic stress of 5k points — smooth UI with sampling enabled.
- FPS counter available in UI (see Performance overlay).

## How to run benchmarks

1. Start dev server:

```bash
npm install
npm run dev
```

2. Open the app and use developer tools to monitor memory and FPS (PerformanceMonitor overlay reports FPS).

## Optimization notes

- Heavy rendering done on canvas with sampling (maxPointsToShow) to avoid overdraw.
- Use requestAnimationFrame loops for FPS measurement and redraws.
- Keep data window capped (useDataStream slices to last N points) to avoid unbounded memory growth.

## Next steps

- Add Web Worker for aggregation and heavy preprocessing.
- Implement OffscreenCanvas for background rendering when needed.
- Automate stress tests and capture FPS traces.
