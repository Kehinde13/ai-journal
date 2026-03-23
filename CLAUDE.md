# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server (choose platform)
npx expo start          # Universal (scan QR with Expo Go)
npx expo start --android
npx expo start --ios
npx expo start --web
```

No lint or test scripts are configured yet.

## Architecture

This is a cross-platform mobile app built with **Expo + React Native + TypeScript**.

- **Entry point**: `index.ts` → registers `App.tsx` as the root component via `registerRootComponent`
- **Main component**: `App.tsx` — currently a minimal scaffold; all app development starts here
- **Config**: `app.json` for Expo settings (name, icons, orientation, platform-specific options)
- **TypeScript**: strict mode enabled, extends `expo/tsconfig.base`
- **Targets**: iOS, Android, and Web from a single codebase

The app is in early-stage scaffolding — no routing, state management, or business logic has been added yet.
