---
name: project-visual-pt
description: Visual PT MVP — React Native + TypeScript real-time pose-estimation workout form-correction app; SPEC structure decisions
metadata:
  type: project
---

Visual PT (비주얼 퍼스널 트레이닝) is a React Native + TypeScript mobile MVP for real-time pose-estimation-based workout form correction, scoped to two exercises: squat and deadlift. Monorepo with `mobile/` (RN app) and `backend/` (Node/Express or Python/FastAPI). On-device ML via MediaPipe tasks-vision (33 joints). Backend uses Claude API + RAG for anatomy feedback (post-MVP focus).

**Why:** Goal is expert-level form correction at home without a personal trainer; 2D camera accuracy is an accepted, disclaimed limitation.

**How to apply:** When writing more SPECs for this project, reuse the established decomposition:
- SPEC-UI-001 = real-time core loop (pose estimation + angle analysis + feedback + camera guide) — these 4 are deliberately ONE SPEC because they share a single frame-processing pipeline, performance budget (30 FPS, <100ms), and the `CameraScreen.tsx` surface. Complexity XL. As of 2026-06-01, all 3 SPEC files (spec.md/plan.md/acceptance.md) are written (status: draft, 5 modules M1~M5, git_strategy manual so issue_number 0).
- SPEC-UI-DB-002 = session recording/storage/playback/analysis report — separated as a persistence concern, depends on stable pose output.
- RAG/Claude knowledge base and AI chatbot are post-MVP (Phase 2) and belong in their own future SPECs (likely API domain).

Performance budget is load-bearing for any UI SPEC: 30 FPS min, <100ms inference/frame, <500ms feedback, <150MB memory, <5%/hr battery. Real-time architecture uses frame-processor worklets + Reanimated UI-thread overlay rendering.
