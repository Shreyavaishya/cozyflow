

# 🍅 Cozy Pomodoro — Implementation Plan

## Overview
A premium, cozy Pomodoro timer app with ambient backgrounds, smooth animations, gamified plant growth, and a polished lo-fi productivity aesthetic. Built with React, TypeScript, Tailwind, and Framer Motion.

---

## Phase 1: Foundation & Design System

- **Warm color palette** — cream/beige light theme, warm charcoal dark theme with amber accents
- **Theme toggle** (light/dark) with smooth transition
- **Glassmorphism card components** with rounded-2xl corners, soft shadows, and gentle gradients
- **Typography** — clean, warm, readable
- **Zustand store** for global state (timer, settings, stats, tasks)
- **LocalStorage persistence** for all user data

## Phase 2: Core Pomodoro Timer

- **Timer logic** — Focus (25m), Short Break (5m), Long Break (15m after 4 sessions)
- **Start / Pause / Resume / Reset** controls
- **Animated circular progress ring** synced with countdown
- **Mode selector** (Focus / Short Break / Long Break)
- **Auto-switch** between modes with optional auto-start
- **Tab-accurate timing** using timestamps (not intervals alone)
- **Session counter** display

## Phase 3: Main Layout & UI

- **Centered layout**: title bar with theme toggle + settings at top, large timer in center, controls at bottom
- **Expandable side panels** for stats, tasks, and sound controls
- **Smooth entrance animations** on all elements
- **Micro-interactions**: button hover depth, press animations, timer completion pulse

## Phase 4: Cozy Animated Background

- **Floating gradient blobs** with slow, calming motion
- **Subtle grain/noise overlay**
- **Ambient glow behind the timer**
- **Mouse parallax effect** on background elements
- **Intensity slider** in settings
- **Performance-optimized** (CSS animations + requestAnimationFrame)

## Phase 5: Custom Animated Cursor

- **Inner dot + outer soft ring** with glow
- **Smooth trailing interpolation** (slight delay for premium feel)
- **Magnetic hover** on interactive elements — cursor scales up
- **Click pulse animation**
- **Auto-disabled on mobile/touch**
- **Toggle in settings**

## Phase 6: Sound System

- **Feedback sounds**: soft click on buttons, bell on session complete
- **Ambient loops**: Rain, Café, Fireplace, White Noise (using royalty-free audio URLs)
- **Controls**: play/pause, volume slider, loop toggle
- **Preferences persisted** in LocalStorage

## Phase 7: Settings Panel

- Modal/drawer with customizable options:
  - Focus, break, and long break durations
  - Auto-start sessions/breaks toggles
  - Theme, cursor, sound, background intensity, notification toggles
- All settings saved locally

## Phase 8: Productivity Features

- **Stats panel**: sessions today, weekly total, all-time total, streak counter
- **Task list**: add, complete, delete tasks — persisted locally
- **Focus streak indicator**: visual progress element

## Phase 9: Growing Plant 🌱 (Gamified Feature)

- Small plant widget near the timer
- Each completed focus session advances growth stage
- Multiple visual stages (seed → sprout → small plant → full bloom)
- Option for daily reset or permanent growth

## Phase 10: Focus Mode & Polish

- **Fullscreen distraction-free mode**: hides all UI except timer + background, Escape to exit
- **Browser notifications** on session complete (with permission request)
- **Beautiful loading animation** on app start
- **Completion celebration animation** (confetti/glow burst)
- **Full responsiveness**: desktop, tablet, mobile with touch-friendly controls

