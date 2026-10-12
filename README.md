# MoodPlayer

A responsive browser music player that uses client-side facial-expression signals to suggest one of three music modes — **Happy**, **Melancholic**, or **Chill** — which the user then confirms or overrides manually.

> The mood suggestion is experimental. It is a playlist recommendation based on a simple heuristic, not a psychological or emotional diagnosis.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- MediaPipe Tasks Vision (Face Landmarker, Gesture Recognizer)
- Three.js / React Three Fiber (Intro visuals)
- pnpm
- Node 24

## Local development

Prerequisites:

- Node 24 (declared in `.mise.toml` and `package.json` `engines`)
- pnpm 10.34.3 (declared in `.mise.toml` and `package.json` `packageManager`; `corepack` can provide it)
- [Git LFS](https://git-lfs.com/) — all images, audio, and video are stored as LFS objects

```bash
git lfs install
git lfs pull
pnpm install
pnpm dev
```

The dev server listens on `0.0.0.0:8443` (override with `PORT`; `strictPort` is enabled). Camera access requires a secure context: use `http://localhost:8443` locally, or HTTPS when testing from another device.

## Available scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Vite dev server |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm format` | Format with oxfmt |

Type-checking has no package script yet:

```bash
pnpm exec tsc --noEmit
```

## Architecture

| Concern | Location |
|---|---|
| Screen flow and shared state | `src/App.tsx`, `src/screens/`, `src/hooks/useFadeTransition.ts` |
| Audio playback (one `HTMLAudioElement` per track) | `src/hooks/usePlayerAudio.ts` |
| Waveform (Web Audio analyser) | `src/hooks/useWaveformAnalyser.ts` |
| Camera stream lifecycle | `src/camera/useCameraStream.ts` |
| MediaPipe facial signal sampling | `src/camera/useFaceLandmarker.ts`, `src/camera/useExpressionSampler.ts` |
| Mood heuristic / mapping | `src/mood/moodHeuristicV1.ts` |
| Gesture controls | `src/gestures/` |
| WebGL Intro | `src/intro3/` |
| Player UI | `src/components/player/` |
| Playlists and mood data | `src/data/` |
| User-facing copy | `src/content/copy.ts` |

Camera processing, mood mapping, gesture recognition, and audio playback are kept in separate hooks/modules; presentation components consume their results rather than owning them.

## Product flow

Intro → Camera Permission → Scan → Vibe Result (confirm or choose another mood) → Player

Camera permission is requested only after an explicit user action. The scan camera stream is released when the user leaves the Camera Permission screen.

## Privacy

- Camera frames are processed client-side by MediaPipe in the browser.
- Camera frames are not uploaded or persisted (no network upload, no `localStorage`/`sessionStorage`/IndexedDB).
- One still image from the scan is held in React memory as a data URL for the Vibe Result screen; it is discarded on reload.
- MediaPipe WASM and model files are fetched at runtime from external hosts (`cdn.jsdelivr.net`, `storage.googleapis.com`).

## Gesture controls

- Opt-in from the Player; off by default.
- Every gesture has an equivalent on-screen control (Open Palm → Play, Closed Fist → Pause, Thumb Up → Next, Thumb Down → Previous).
- Raw per-frame recognition is filtered before dispatch: a gesture must be held, fires once per hold, and is subject to a cooldown (`src/gestures/gestureStabilizer.ts`).

## Deployment

Hosted on Vercel (Vite preset, `pnpm install`, `pnpm run build`, output `dist`).

- `develop` → Vercel Preview deployment
- Verified changes → fast-forward `main`
- `main` → Production: https://moodplayer-vibe.vercel.app
- GitHub commit statuses link to the corresponding Vercel deployments.
- Git LFS must be enabled for Vercel builds; otherwise LFS pointer files are deployed instead of audio and images.

## Browser / device considerations

- Camera requires a secure context (HTTPS or `localhost`).
- Some Safari/iOS audio edge cases (autoplay, preloading across track changes) still need real-device verification.
- MediaPipe and WebGL capabilities vary by device and browser.
- `prefers-reduced-motion` is respected.

No formal browser-support matrix has been tested.

## Known limitations

- Mood classification is a heuristic over facial signals.
- No automated test coverage yet.
- MediaPipe WASM and model assets load from external CDNs.
- The Intro WebGL chunk is relatively large (~950 kB minified).

## Figma Make legacy

The project originated in Figma Make. `.figma/make/site.json` is still retained because the site-configuration plugin in `vite.config.ts` reads it to generate page metadata (title, description, favicon) and `robots.txt`. The remaining `.figma/make/` scripts and dev-only Vite plugins are leftovers from that environment; active development now happens through the standard React/TypeScript/GitHub workflow.
