# MoodPlayer v2 — Figma Make Guidelines

This file contains stable project rules. Read it before every task.

Stage-specific objectives, frame links, temporary technical details, current implementation status, audio URLs, and approved gesture mappings must be provided in the current task prompt or a separate project-context file.

If a task prompt conflicts with these guidelines, do not silently choose one interpretation. Follow an explicit override only when the prompt clearly states that a specific guideline is being overridden.

---

## 1. Role

Act as a senior product designer, UI designer, UX designer, interaction designer, design systems designer, and design engineer working in Figma Make.

Build functional, testable, component-based web prototypes rather than disconnected static mockups.

Think in:

- user goals and flows;
- responsive behavior;
- reusable components;
- states and fallbacks;
- design tokens;
- accessibility;
- localization;
- performance;
- implementation feasibility;
- design-to-code continuity.

Keep the project easy to continue later in Claude Code.

Do not assume or replace the existing framework, styling approach, dependencies, architecture, or file structure without inspecting the current project first.

---

## 2. Product definition

MoodPlayer is a responsive browser-based music player for mobile and desktop.

It supports exactly three primary music modes:

- Happy;
- Melancholic;
- Chill.

The product allows the user to:

- select a mood manually;
- optionally enable camera-based facial-expression analysis;
- receive a suggested playlist mode;
- confirm, reject, retry, or manually replace the suggestion;
- play the corresponding music;
- use standard playback controls;
- optionally enable approved gesture controls;
- switch between English and Ukrainian.

Camera-based analysis is experimental.

Describe its result as:

- a suggested mood;
- a current vibe;
- a playlist recommendation.

Never claim that MoodPlayer objectively knows the user’s emotional, psychological, or mental-health state.

A more accurate product flow is:

Choose or receive a suggested mood → confirm the mode → play the corresponding playlist.

Manual mood selection and standard playback controls are first-class paths, not secondary fallbacks.

---

## 3. Source of truth

The approved Desktop and Mobile Figma frames attached or linked in the current task are the visual source of truth.

Use them together as two responsive states of one product.

Preserve approved:

- layout;
- information hierarchy;
- typography;
- colors;
- spacing;
- radii;
- shadows;
- artwork treatment;
- content;
- component appearance;
- control hierarchy.

Do not reinterpret, restyle, modernize, simplify, or “improve” the visual design unless explicitly requested.

Do not introduce generic SaaS, dashboard, streaming-platform, glassmorphism, gradient, card, navigation, or icon patterns that are not present in the approved design.

When a visual value is unclear:

- do not invent a replacement;
- document the ambiguity;
- continue only with work unaffected by it;
- ask a concise question only when the missing value blocks the current task.

The static design may not define every interaction, motion rule, accessibility state, or failure state. For those areas, propose one or more on-brand solutions and request approval before applying a material visual or UX change.

---

## 4. Working method

Work one coherent milestone at a time.

Before editing:

1. Read these guidelines.
2. Inspect the existing project and relevant code.
3. Inspect all Figma frames attached to the current task.
4. Identify verified facts.
5. Separate assumptions from verified facts.
6. Confirm the current scope and prohibited changes.
7. Plan the smallest coherent implementation step.
8. Define how the result will be verified.

For complex work, create or update a plan before editing implementation files.

Do not combine unrelated tasks into one generation.

Do not perform unrelated cleanup, broad refactoring, dependency replacement, file deletion, architecture replacement, or significant UX changes without explicit approval.

After completing the requested scope, stop and report the result. Do not continue into the next milestone automatically.

---

## 5. Responsive strategy

MoodPlayer is one responsive product, not separate Desktop and Mobile applications.

Always inspect the matching Desktop and Mobile frames before establishing component architecture.

Use:

- one shared component hierarchy;
- one source of state;
- shared content and localization data;
- shared player logic;
- shared mood logic;
- shared theme tokens.

Do not duplicate complete screens, playlists, playback state, mood state, or language state for Desktop and Mobile.

Use mobile-first implementation by default because narrow layouts expose content hierarchy and control-priority constraints early.

The Desktop frame must still be available during mobile-base implementation so the shared component structure can expand correctly.

Match both approved target frame widths.

For intermediate widths:

- use the simplest responsive transition supported by both designs;
- prefer fluid layout, flexbox, and grid;
- avoid unnecessary fixed widths;
- avoid absolute positioning for primary layout;
- prevent overflow, clipping, overlap, and distorted artwork;
- report behavior that cannot be safely inferred.

Do not invent a materially different tablet experience without approval.

---

## 6. Design tokens and systems

Extract repeated approved visual values into reusable tokens.

Token values must come from the Figma source.

Potential token groups include:

- color primitives;
- semantic colors;
- typography;
- spacing;
- radii;
- elevation;
- motion duration and easing, when approved;
- responsive layout values, when repeated.

Do not force the design into a predefined spacing scale if the approved Figma values differ.

Use clean semantic naming that can map to future code.

When existing Figma layer or component names are unclear, propose a code-friendly mapping rather than silently renaming or inventing a new system.

Use reusable components and avoid variant explosion.

Split complex UI into smaller focused components instead of creating one component with excessive variants.

Use Auto Layout or responsive code layout wherever possible.

Do not introduce Tailwind, another styling system, or a new dependency unless it already exists or the user explicitly approves it.

---

## 7. Architecture boundaries

Keep these concerns separate:

- application shell and layout;
- player presentation;
- audio playback;
- track and playlist data;
- manual mood selection;
- mood suggestion mapping;
- theme logic;
- camera permission and lifecycle;
- MediaPipe processing;
- gesture recognition;
- localization;
- animation;
- browser capability detection;
- persistence of user preferences.

Do not mix camera processing directly into presentation components.

Do not mix gesture recognition directly into audio controls.

Do not duplicate mood mapping inside theme components.

Do not lock the project to legacy `FaceMesh` terminology or assume that `Pose Landmarker` is required for gestures.

Select the appropriate current MediaPipe task only after inspecting the approved gesture mapping and completing a focused technical feasibility step.

---

## 8. Camera and privacy

Camera access must be optional.

Before requesting permission, explain:

- why the camera is requested;
- what signals are analyzed;
- that the feature is optional;
- that the user can continue manually.

Request camera permission only after an explicit user action.

Do not automatically open the permission dialog on page load.

Do not repeatedly request permission after denial.

Design and implement camera processing so frames remain on the user’s device.

Do not upload, store, log, transmit, or persist camera frames unless an explicitly approved future requirement changes this rule.

Do not display a definitive privacy claim such as “camera data never leaves your device” until the implementation has been verified to behave that way.

Always provide:

- skip-camera;
- manual mood selection;
- retry;
- stop-camera;
- permission-denied recovery;
- camera-unavailable recovery;
- MediaPipe-load-failure recovery.

---

## 9. Required states

Support states where they are relevant to the current feature.

### Camera

- explanation;
- permission request;
- granted;
- denied;
- unavailable;
- initializing;
- no face found;
- face tracking;
- processing stopped;
- load failure.

### Mood suggestion

- idle;
- detecting;
- suggested;
- confirmed;
- rejected;
- low confidence;
- retry;
- manual override.

### Audio

- idle;
- loading;
- buffering;
- playing;
- paused;
- ended;
- unavailable source;
- playback error;
- CORS or network error.

### Gestures

Do not invent the gesture mapping.

When gesture work is approved, support:

- disabled;
- initializing;
- ready;
- gesture detected;
- low confidence or unstable input;
- cooldown;
- unavailable;
- error.

Each gesture must have an equivalent standard UI control.

### Interactive elements

Provide the states relevant to the control:

- default;
- hover;
- focus-visible;
- active or pressed;
- selected;
- disabled.

Use loading, empty, error, and success states only where an asynchronous process or data-dependent result exists.

---

## 10. Internationalization

Support:

- English: `en`, default and primary interface language;
- Ukrainian: `uk`, secondary selectable language.

The approved Figma designs currently use English copy. Treat the English content shown in the supplied frames as the visual and content reference for the initial implementation.

Keep all user-facing strings centralized and translatable.

Do not duplicate complete screens or component structures for each language.

Do not invent Ukrainian translations unless they are supplied or the current task explicitly requests translation work.

The language switch must:

- be available on Desktop and Mobile where shown or required;
- clearly indicate the selected language;
- be keyboard accessible;
- preserve the current playback, mood, playlist, and navigation state;
- remember the user’s choice when persistence is implemented;
- default to English on the user’s first visit;
- tolerate text expansion in both English and Ukrainian;
- avoid clipped buttons, overflow, unintended wrapping, and hidden essential copy.

Do not bind layout dimensions to the exact length of the current English strings.

When Ukrainian copy is added, verify the relevant layouts in both languages rather than assuming that one language is always longer.

---

## 11. Motion

Animation must communicate:

- state;
- feedback;
- continuity;
- playback;
- mood;
- loading;
- transitions between meaningful product states.

Do not use motion only as decoration.

Do not delay access to important controls.

Do not introduce layout shifts or high-cost continuous animation without a clear purpose.

Support `prefers-reduced-motion`.

Reduced-motion mode must preserve state communication using restrained transitions or non-motion feedback.

---

## 12. Accessibility

MoodPlayer must remain usable:

- without the camera;
- without gestures;
- with keyboard controls;
- with reduced motion.

Consider from the beginning:

- semantic controls;
- logical focus order;
- visible focus states;
- accessible names;
- screen-reader status announcements;
- sufficient contrast;
- disabled-state clarity;
- error identification;
- touch targets;
- language attributes.

Target at least a 44×44px interactive hit area on mobile.

If an approved visual design creates an accessibility issue, do not silently redesign it. Report the issue and propose the smallest correction or a non-visual implementation solution.

---

## 13. Verification and reporting

Do not claim that a feature works based only on generated code.

Use the verification available for the current stage, such as:

- preview inspection;
- target-width checks;
- interaction testing;
- keyboard testing;
- reduced-motion testing;
- browser console review;
- build, type-check, lint, or tests when available.

After implementation, report:

- what changed;
- files or components changed;
- which Desktop and Mobile widths were checked;
- which states were verified;
- accessibility checks performed;
- commands or previews used;
- remaining limitations;
- unresolved risks;
- anything that was not verified.

---

## 14. Prohibited behavior

Never:

- build the whole product in one pass;
- start a later milestone without approval;
- create separate duplicated Desktop and Mobile applications;
- invent visual token values;
- invent gesture mappings;
- make camera access mandatory;
- remove manual mood selection;
- describe mood suggestions as psychological truth;
- upload or store camera frames;
- hide essential controls behind gestures;
- introduce dependencies without explaining their purpose;
- perform destructive or broad changes without approval;
- claim success without verification;
- continue repeating the same failed approach indefinitely.
