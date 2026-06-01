---
name: project-tdd-setup
description: Visual PT 모바일 앱 SPEC-UI-001 Phase A+B TDD 설정 및 완료 상태
metadata:
  type: project
---

Phase A+B 구현 완료 (2026-06-01).

**Why:** SPEC-UI-001 순수 로직 레이어 구현 — 네이티브 의존성 없이 타입/설정/수학 유틸/서비스/스토어 구축.

**How to apply:** Phase C(네이티브 포즈 추정), D(UI 오버레이), E(카메라 통합) 구현 시 이 레이어를 기반으로 확장.

## Jest 설정 이슈 (해결됨)

- `@types/react-native@~0.74.0` 버전 없음 → `~0.73.0` 으로 수정
- `setupFilesAfterFramework` 오타 (jest 공식 옵션 아님) — warning 이지만 무해
- `testEnvironment: "node"` + custom `transform` 추가로 RN 파싱 오류 해결
- `moduleNameMapper`로 expo-speech 를 `src/__mocks__/expo-speech.ts` 로 매핑

## 테스트 결과 (최종)

- 총 89개 테스트, 6개 파일, 전체 통과
- 커버리지 (PoseEstimationService 제외): Stmts 100%, Branch 93.24%, Funcs 100%, Lines 100%

## 미커버 브랜치 (구조적 한계)

JointAngleCalculator의 `'kneeAngle' in config` 등 조건의 false 경로는 현재 squat/deadlift 모두 해당 키를 가지고 있어 실행 불가. Phase C 에서 exercise 타입 확장 시 자연 해소 예정.

## 파일 목록

구현 파일:
- src/types/pose.types.ts
- src/types/feedback.types.ts
- src/config/pose.config.ts
- src/config/feedback.config.ts
- src/utils/mathHelpers.ts
- src/services/JointAngleCalculator.ts
- src/services/FeedbackGenerator.ts
- src/services/AudioFeedbackService.ts
- src/store/feedbackStore.ts
- src/store/workoutStore.ts

테스트 파일:
- src/__tests__/utils/mathHelpers.test.ts (19개)
- src/__tests__/services/JointAngleCalculator.test.ts (24개)
- src/__tests__/services/FeedbackGenerator.test.ts (8개)
- src/__tests__/services/AudioFeedbackService.test.ts (10개)
- src/__tests__/store/feedbackStore.test.ts (13개)
- src/__tests__/store/workoutStore.test.ts (15개)

추가 파일:
- src/__mocks__/expo-speech.ts (네이티브 모킹)
