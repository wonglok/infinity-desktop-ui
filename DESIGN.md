# Design system — Infinity Cloud Desktop UI

## Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#f7f5f8` | Desktop background (soft pearl gradient) |
| `--bg-glass` | `rgba(255,255,252,0.60–0.82)` | Frosted glass surfaces |
| `--ink-primary` | `#1d1a28` | Headings, active text |
| `--ink-secondary` | `#3d3a4d` | Body text |
| `--ink-muted` | `#5e5a70` / `#4a4658` / `#6b6680` | Secondary labels, hints |
| `--accent` | `#7c6fd4` (`rgba(124,111,212,…)`) | Buttons, gradients, focus rings |
| `--accent-gradient` | `linear-gradient(135deg, rgba(124,111,212,0.65), rgba(160,140,220,0.5))` | Avatar, hero elements |
| `--error` | `#c41e1e` on `rgba(239,68,68,0.06)` | Error states |
| `--divider` | `rgba(0,0,0,0.06–0.08)` | Separators |
| `--shadow-tint` | `rgba(80,60,100,…)` | Warm-tinted shadows |

OKLCH equivalents (light theme):
- bg-base: `oklch(0.97 0.008 300)` (near-white with subtle purple lean)
- ink-primary: `oklch(0.15 0.015 280)` (deep violet-black)
- accent: `oklch(0.58 0.16 290)` (muted purple)

Dark mode: `#0a0a0a` bg, `#ededed` foreground.

## Typography

- **Primary**: Geist Sans (next/font/google, variable weight)
- **Monospace**: Geist Mono (next/font/google, for terminal)
- **Scale**: 13px (UI labels/taskbar), 14px (body/menu), 15px (inputs/headings), 8xl (login clock)
- **Weights**: font-light (date), font-medium (labels, buttons), font-extralight (clock)
- **Tracking**: tight (clock), wide (section labels), normal (body)

## Surface treatment

All major surfaces use frosted glass:
```
background: rgba(255,255,252,0.60–0.82)
backdropFilter: blur(24–32px) saturate(140–160%)
WebkitBackdropFilter: blur(24–32px) saturate(140–160%)
boxShadow: … rgba(80,60,100,…) … inset 0 1px 0 rgba(255,255,255,0.5–0.6)
border: 1px solid rgba(0,0,0,0.06–0.09)
```

Active surfaces get higher opacity and deeper shadows; inactive surfaces are more transparent.

## Radii
- 10px: small icon buttons (WinButton)
- 12px: taskbar buttons, menu items
- 14px: form inputs
- 18px: windows (non-maximized)
- 20px: modal
- 22px: login card

## Motion
- Duration: 150ms (buttons, taskbar), 200ms (windows, inputs)
- Easing: CSS default ease (Tailwind transition)
- Window minimize: opacity 0→1 with pointer-events toggle

## Components

### Window
Frosted glass container with title bar, content area, resize handles. Active/inactive states via opacity and shadow.

### Taskbar
Bottom-docked translucent bar (z-index 8000) with Start button, running apps, system tray.

### Modal
Centered glass dialog (z-index 9999) with backdrop blur, Escape-key dismiss. Supports confirm/prompt/alert types.

### Start Menu
Glass popup anchored above taskbar, outside-click and Escape-key dismiss.

### Login Screen
Fullscreen with background, live clock, glass login card.

## Layout
- Desktop metaphor: absolute positioning for windows and icons
- Taskbar: fixed bottom, 56px (h-14)
- Z-index scale: windows (auto-incrementing from 10), taskbar (8000), start menu (9000), login/modal (9999)
