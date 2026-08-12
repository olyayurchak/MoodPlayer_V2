# MoodPlayer v2 — Milestone 1: Responsive Intro Screen Foundation

## Objective

Implement the static responsive MoodPlayer Intro screen based on the attached approved designs.

Replace the unrelated scaffold demo with the first real MoodPlayer screen.

Do not implement animation or product functionality in this milestone.

## Attached references and their roles

1. Desktop frame:
   - Primary static layout reference.
   - Approved viewport width: 1440px.
   - Use the exact frame height and internal content dimensions from Figma.

2. Mobile frame:
   - Primary static layout reference.
   - Approved size: 430 × 932.

3. Additional frame showing displaced or scattered bubbles:
   - Motion reference for future Desktop interaction only.
   - It is not a separate screen and not the default static layout.
   - Do not reproduce its bubble positions as the initial state.
   - Do not implement the motion effect during this milestone.

The Desktop and Mobile frames are the visual source of truth.

## Inspect first

Before editing, inspect:

- `guidelines/Guidelines.md`;
- the current Vite + React 19 + Tailwind v4 project;
- the existing file and import structure;
- all three attached Figma references;
- the previous design audit in this conversation.

Do not delete, move, rename, or consolidate duplicate import folders.

## Visual implementation

Reproduce the approved Intro design exactly at both target sizes.

Preserve:

- background color;
- ambient glow composition;
- wordmark;
- tagline;
- CTA;
- typography;
- spacing;
- bubble artwork;
- masks;
- bubble sizes;
- rotations;
- overlap;
- positioning;
- Desktop and Mobile composition differences.

Do not redesign, simplify, modernize, or add UI not shown in the static frames.

English is the default interface language.

Do not add the language switch yet because it is not shown on this Intro screen.

## Responsive structure

Build one shared responsive implementation.

Do not create separate Desktop and Mobile applications or duplicate the complete screen markup.

Use:

- a mobile-first base;
- one shared component hierarchy;
- flex or grid for the primary content structure;
- responsive typography and spacing;
- one structural breakpoint for the Desktop bubble composition;
- data-driven bubble configurations.

The Mobile and Desktop bubble clusters may use different configuration data because their bubble count and arrangement differ.

The decorative bubble cluster may use absolute positioning only inside its own relative container.

For intermediate widths:

- use a simple responsive transition;
- prevent horizontal overflow;
- prevent text clipping;
- preserve artwork proportions;
- do not invent a separate tablet composition.

## Future Desktop bubble interaction

Do not implement this interaction now.

However, prepare the bubble structure for a later effect where:

- bubbles react to cursor proximity;
- bubbles move away from the cursor;
- bubbles smoothly return to their approved original positions;
- every bubble keeps its own base position, size, and rotation.

Keep the approved static transform separate from the future motion offset so the interaction can be added without rebuilding the cluster.

The bubbles are decorative and not clickable.

Hide them from assistive technology.

Do not invent:

- movement distance;
- physics;
- easing;
- duration;
- collision behavior;
- idle animation;
- Mobile touch behavior.

## Components

Create small reusable components where appropriate:

- `IntroScreen`
- `AppBackground`
- `TextStack`
- `CtaPill`
- `PlayIconGlow`
- `MoodBubble`
- `MoodBubbleCluster`

Adjust names only when the existing project structure clearly requires a better equivalent.

Keep bubble content data-driven.

The CTA must be a semantic button, but do not invent its destination or navigation behavior.

Centralize the visible English strings without adding an i18n dependency or Ukrainian translations.

## Design tokens

Create the initial token foundation using only values verified in Figma:

- colors;
- typography;
- spacing;
- radii;
- shadows;
- blur;
- repeated layout values.

Use the existing Tailwind v4 setup where appropriate.

Do not normalize, round, replace, or invent values.

Use the exact approved fonts and weights. Do not substitute fonts.

## Out of scope

Do not implement:

- audio;
- playlists;
- CTA navigation;
- camera permissions;
- MediaPipe;
- mood detection;
- gestures;
- bubble motion;
- entrance animation;
- animated background glows;
- language switching;
- Ukrainian copy;
- additional screens;
- backend integration;
- new dependencies;
- unrelated cleanup.

## Verification

Verify:

- Mobile at 430 × 932;
- Desktop at 1440px width and the exact approved frame height;
- bubble count and arrangement at both sizes;
- exact font usage;
- no horizontal overflow;
- no clipped content;
- no distorted artwork;
- CTA keyboard focusability;
- browser console;
- production build;
- available type-check.

Do not claim exact visual reproduction unless both target sizes were checked against Figma.

## Report

After implementation, report:

1. Changed files.
2. Created components.
3. Created tokens.
4. Responsive behavior implemented.
5. Verification completed.
6. Visible differences from Figma.
7. Remaining questions or risks.

Stop after this milestone.