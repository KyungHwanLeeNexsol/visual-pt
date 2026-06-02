---
id: SPEC-ENHANCE-001
version: "1.0.0"
status: draft
created: "2026-06-02"
updated: "2026-06-02"
author: "Visual PT Team"
priority: high
issue_number: 0
---

# SPEC-ENHANCE-001 코드베이스 분석 (research.md)

기존 코드를 수정하는 SPEC이므로, 현재 구현 상태를 근거로 요구사항을 정렬한다.

## 현재 동작 (검증된 사실)

### Feature 1 관련
- `services/JointAngleCalculator.ts:65` — `void exercise; // 현재는 운동 종류에 무관하게 동일 계산` 존재. `calculateAngles`는 운동과 무관하게 무릎·엉덩이·척추·어깨 각도를 모두 계산한다.
- `services/JointAngleCalculator.ts:80-168` — `detectErrors(angles, exercise)`는 이미 `POSE_CONFIG[exercise]`를 사용해 운동별 임계값으로 에러를 감지한다(운동별 검증은 일부 이미 동작). `'kneeAngle' in config` 등 키 존재 검사로 분기.
- `services/FeedbackGenerator.ts:14` — `void exercise; // Phase D 에서 운동별 맞춤 메시지 확장 예정` 존재. `errorToMessage`는 `FEEDBACK_MESSAGES[error.type]`만 사용하여 운동과 무관한 공통 메시지를 반환한다.
- `config/pose.config.ts:8-21` — `POSE_CONFIG`에 `squat`/`deadlift` 각각 `kneeAngle`/`hipAngle`/`spineAngle`/`shoulderAngle` 범위가 이미 정의됨. `as const` + `ExerciseConfig` 타입 export.
- `config/feedback.config.ts:10-27` — `FEEDBACK_MESSAGES`는 `Record<FormErrorType, {text, speechText}>` 공통 매핑. 운동별 분기 없음.
- 타입: `types/pose.types.ts:63` — `ExerciseType = 'squat' | 'deadlift'`. `JointAngles`는 선택적 각도 필드(`leftKnee?` 등).

### Feature 2 관련
- `screens/CameraScreen.tsx:116-121` — `handleEndSession`이 `endSession()` 후 `navigation.goBack()` 호출. 요약 화면으로의 전환 없음.
- `store/workoutStore.ts` — `endSession()`이 `currentAngles: null`로 초기화. 시계열 누적·rep 카운트·요약 통계 없음.
- `navigation/types.ts:7-11` — `RootStackParamList`는 `Home` / `WorkoutSelection` / `Camera`만 정의. `SessionSummary` 라우트 없음.
- 세션 데이터 누적 메커니즘이 전혀 없음 → `SessionAnalyticsService`/`sessionAnalyticsStore` 신규 필요.

### Feature 3 관련
- Gemini/AI 코칭 관련 코드·패키지 없음. `@google/generative-ai`는 **백엔드 서버(`server/`) 전용**으로 신규 도입(클라이언트에는 설치하지 않음). 클라이언트는 `react-native-config`로 `API_BASE_URL`만 주입받아 백엔드 `/api/coaching`을 `fetch`로 호출(신규 도입 필요).
- 환경 변수 주입 메커니즘 없음: 서버 측 `server/.env`(Gemini 키), 클라이언트 측 `mobile/.env`(`API_BASE_URL`) + `types/env.d.ts` 신규 필요.

## 제약 확인
- `CameraScreen.tsx:127-139` — `frameProcessor`는 mock(TODO). 본 SPEC은 이를 수정하지 않음(Exclusions).
- `language.yaml` — `conversation_language: ko`, `code_comments: ko`. UI/주석 한국어 강제.
- 기존 테스트 존재: `__tests__/services/JointAngleCalculator.test.ts`, `FeedbackGenerator.test.ts`, `store/workoutStore.test.ts` 등 → 회귀 방지 기준선.

## 통합 지점 (Integration Points)
- F1 출력(운동별 각도) → F2 입력(시계열 누적·rep 카운트).
- F2 출력(세션 요약 객체) → F3 입력(Gemini 프롬프트).
- F2 신규 라우트(`SessionSummary`)는 `CameraScreen.handleEndSession`이 호출하는 종착점.

## 하위 호환 전략
- `POSE_CONFIG`/`FEEDBACK_MESSAGES` 기존 구조 보존, 운동별 항목은 **추가**로 확장.
- 운동별 메시지 미정의 시 공통 메시지 폴백 → SPEC-UI-001 동작 유지(REQ-E1-005, E1-007).
- `RootStackParamList`는 라우트 추가만(기존 라우트 불변, REQ-E2-007).
