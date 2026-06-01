---
name: project-pose-stack
description: Visual PT pose-estimation integration — @mediapipe/tasks-vision is NOT viable in React Native; use native vision-camera plugin instead
metadata:
  type: project
---

For Visual PT (React Native), the on-device pose estimation stack listed in early SPEC drafts (`@mediapipe/tasks-vision` + `expo-camera` frame processor) is the WRONG integration pattern. `@mediapipe/tasks-vision` is a WebAssembly/browser library (Web Workers + WASM), not a native RN module — it cannot run efficiently on-device in RN.

**Correct pattern (verified 2026-06):** `react-native-vision-camera` v4 frame processor + a native MediaPipe BlazePose plugin. Two viable libraries:
- `react-native-mediapipe-posedetection` (EndLess728) v0.4.0 — RN 0.74+, New Architecture ONLY, Expo config plugin available, iOS 12+/Android API24+, 33 landmarks + world coords, GPU accel, but auto-throttles to ~15 FPS. Requires react-native-vision-camera ^4.0.0 + react-native-worklets-core ^1.0.0.
- `react-native-mediapipe` (cdiddy77) — usePoseDetection hook, LIVE_STREAM mode, GPU/CPU delegate config.

**Why:** Confirmed via npm + GitHub research. expo-camera does NOT expose a frame processor API the way vision-camera does; the SPEC's perf targets (30 FPS) conflict with the native lib's 15 FPS throttle — frame-sampling reconciles this.

**How to apply:** Any pose/camera SPEC planning must recommend vision-camera over expo-camera, flag New Architecture as a hard constraint, and treat 30 FPS render / 15 FPS inference as a decoupled threading model (Reanimated shared values for the 30 FPS skeleton overlay, sampled inference underneath). See [[project-visual-pt]].
