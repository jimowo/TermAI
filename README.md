# TermAI

TermAI is a Tauri 2 desktop prototype for terminal-first AI workflows. The current MVP now uses an Xshell-inspired three-column layout: connection management on the left, a terminal-centric shell workspace in the middle, and an AI agent sidecar on the right.

## Stack

- Tauri 2
- Rust backend commands
- React 18 + TypeScript
- Vite
- Playwright for browser smoke testing

## Getting started

```bash
npm install
npm run tauri dev
```

## Available scripts

- `npm run dev` — start the Vite frontend only.
- `npm run build` — type-check and build the frontend bundle.
- `npm run tauri dev` — run the desktop app in development mode.
- `npm run tauri build` — produce a desktop bundle.
- `npm run test:e2e` — run the Playwright browser smoke test against the Vite app.

## Current MVP scope

- Xshell-inspired shell workspace with connection cards and terminal activity
- AI agent sidebar for planning, repository review, and command staging
- Workspace overview powered by a Tauri command
- Simulated shell command queueing tied to agent recommendations
- Playwright smoke coverage for the desktop UI shell

## Next milestones

1. Connect the terminal panel to a real session runtime.
2. Persist shell history, agent state, and workspace summaries on disk.
3. Add repository scanning and file-aware prompts.
4. Turn suggested agent commands into executable, permission-aware tools.

## Release workflow

A GitHub Actions workflow now watches the `release` branch and `workflow_dispatch` events. It first verifies the frontend bundle and Playwright smoke test on Ubuntu, then builds/publishes draft Tauri releases for macOS, Linux, and Windows using `tauri-action`.
