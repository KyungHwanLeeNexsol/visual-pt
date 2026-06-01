---
name: project-phase-cd
description: Visual PT mobile Phase C+D implementation details — native pose pipeline hooks and rendering components
metadata:
  type: project
---

Phase C+D TDD completed for Visual PT mobile app (SPEC-UI-001).

**Why:** Native MediaPipe pipeline requires abstraction layer for testability; all native modules mocked with `{ virtual: true }`.

**How to apply:** Node runtime at `/c/Program Files/nodejs`. Run tests with `export PATH="/c/Program Files/nodejs:$PATH" && cd /c/Users/Nexsol/Documents/visual-pt/mobile && npx jest`.

Files created (Phase C — Native Pose Pipeline):
- `src/services/PoseEstimationService.ts` — IPoseEstimationService interface + implementation with initialized flag
- `src/hooks/useCamera.ts` — Camera permission hook wrapping react-native-vision-camera
- `src/hooks/usePoseDetection.ts` — Pose detection state hook wrapping PoseEstimationService
- `src/hooks/useJointAngles.ts` — Memoized joint angle calculator hook
- `src/hooks/useFeedback.ts` — Feedback state + AudioFeedbackService integration

Files created (Phase D — Rendering Components):
- `src/components/CameraOverlay.tsx` — SVG skeleton overlay with error coloring (#FF0000/#00FF00)
- `src/components/FeedbackBadge.tsx` — Text feedback badge (AC-5)
- `src/components/CameraGuideOverlay.tsx` — Camera positioning guide with repositioning warning (AC-8, AC-9)
- `src/components/JointAngleDisplay.tsx` — Debug angle display

Test files (9 new, all passing):
- `src/__tests__/services/PoseEstimationService.test.ts` — 6 tests
- `src/__tests__/hooks/useCamera.test.ts` — 4 tests
- `src/__tests__/hooks/usePoseDetection.test.ts` — 4 tests
- `src/__tests__/hooks/useJointAngles.test.ts` — 5 tests
- `src/__tests__/hooks/useFeedback.test.ts` — 5 tests
- `src/__tests__/components/CameraOverlay.test.tsx` — 5 tests
- `src/__tests__/components/FeedbackBadge.test.tsx` — 5 tests
- `src/__tests__/components/CameraGuideOverlay.test.tsx` — 7 tests
- `src/__tests__/components/JointAngleDisplay.test.tsx` — 6 tests

Total: 136 passing (Phase A+B: 89, Phase C+D: 47).

Key constraints:
- CameraGuideOverlay warning text uses "재배치" (not "카메라") for unique text matching in tests
- react-native-vision-camera and react-native-mediapipe-posedetection must use `{ virtual: true }` mock option
- package.json has typo `setupFilesAfterFramework` (should be `setupFilesAfterFramework`) — causes validation warning but doesn't block tests
