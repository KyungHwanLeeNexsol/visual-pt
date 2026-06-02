---
id: SPEC-ENHANCE-001
version: "1.1.0"
status: draft
created: "2026-06-02"
updated: "2026-06-02"
author: "Visual PT Team"
priority: high
issue_number: 0
---

# SPEC-ENHANCE-001 인수 기준 (acceptance.md)

Given-When-Then 형식의 인수 시나리오, 엣지 케이스, 품질 게이트, Definition of Done을 정의한다.

## Feature 1: 운동별 각도 정교화

### AC-E1-1 (REQ-E1-001, E1-003): 스쿼트 각도 계산
- **Given** 유효한 33개 랜드마크와 `exercise = 'squat'`가 주어졌을 때
- **When** `JointAngleCalculator.calculateAngles(landmarks, 'squat')`를 호출하면
- **Then** 스쿼트에 필요한 무릎·엉덩이·척추 각도가 계산되어 반환되고, 소스에 `void exercise`가 존재하지 않는다.

### AC-E1-2 (REQ-E1-002, E1-004): 데드리프트 피드백 분기
- **Given** 동일한 `HIP_ALIGNMENT` 에러와 두 운동 타입이 주어졌을 때
- **When** `FeedbackGenerator.generateMessages([error], 'squat')`와 `(..., 'deadlift')`를 각각 호출하면
- **Then** 두 호출은 서로 다른(운동 맥락에 맞는) 한국어 `text`를 반환한다.

### AC-E1-3 (REQ-E1-005): 운동별 메시지 완전성
- **Given** `feedback.config.ts`의 운동별 메시지 맵이 정의되었을 때
- **When** 모든 `FormErrorType` × 지원 운동 조합을 조회하면
- **Then** 각 조합은 빈 문자열이 아닌 한국어 `text`/`speechText`를 반환하거나 공통 메시지로 폴백한다.

### AC-E1-4 (REQ-E1-007): 미지원 운동 방어
- **Given** 정의되지 않은 운동 타입 문자열이 주어졌을 때
- **When** `calculateAngles`/`generateMessages`를 호출하면
- **Then** 예외 없이 공통 기본 동작 결과가 반환된다.

## Feature 2: 세션 분석 및 요약

### AC-E2-1 (REQ-E2-001): 시계열 누적
- **Given** 활성 세션과 연속된 포즈 프레임이 주어졌을 때
- **When** 각 프레임의 각도를 `SessionAnalyticsService`에 기록하면
- **Then** 누적 샘플 수가 프레임 수만큼 단조 증가하고 각 샘플은 타임스탬프를 가진다.

### AC-E2-2 (REQ-E2-002): 스쿼트 rep 카운트
- **Given** 무릎 각도가 하강 임계값 아래로 내려갔다가 상승 임계값 위로 복귀하는 합성 시계열(3주기)이 주어졌을 때
- **When** `exercise = 'squat'`로 rep 카운트를 수행하면
- **Then** `totalReps === 3`이며, 미완료 주기는 카운트되지 않는다.

### AC-E2-3 (REQ-E2-003): 데드리프트 rep 카운트
- **Given** 엉덩이 힌지 굽힘→신전 2주기 합성 시계열이 주어졌을 때
- **When** `exercise = 'deadlift'`로 rep 카운트를 수행하면
- **Then** `totalReps === 2`이다.

### AC-E2-4 (REQ-E2-004): 요약 통계
- **Given** rep과 에러가 누적된 종료 세션이 주어졌을 때
- **When** 세션 요약을 계산하면
- **Then** 요약은 `totalReps`, 관절별 평균 각도, `FormErrorType`별 발생 빈도를 포함한다.

### AC-E2-5 (REQ-E2-005): 인메모리·비영속
- **Given** 분석 데이터가 적재된 `sessionAnalyticsStore`가 있을 때
- **When** 새 세션을 시작하면
- **Then** 이전 세션 데이터가 초기화되고, store에 persist 미들웨어가 적용되어 있지 않다.

### AC-E2-6 (REQ-E2-006, E2-007): 요약 화면 내비게이션
- **Given** 활성 세션의 `CameraScreen`이 표시되었을 때
- **When** "세션 종료" 버튼을 누르면
- **Then** `goBack()`이 아니라 `SessionSummaryScreen`으로 내비게이트되고, 총 reps·평균 각도·에러 빈도가 한국어로 표시된다.

### AC-E2-7 (REQ-E2-008): 빈 데이터 요약
- **Given** 샘플 0건으로 종료된 세션이 주어졌을 때
- **When** `SessionSummaryScreen`이 렌더링되면
- **Then** 충돌 없이 "기록된 동작이 없습니다" 류의 한국어 안내가 표시된다.

## Feature 3: Gemini AI 코칭 (백엔드 프록시)

### AC-E3-1 (REQ-E3-001): 백엔드 코칭 요청 구성
- **Given** 운동 종류·reps·평균 각도·에러 패턴을 가진 세션 요약이 주어졌을 때
- **When** `AICoachingService`가 코칭을 요청하면
- **Then** `${API_BASE_URL}/api/coaching`로 `POST` 요청이 전송되고 요청 본문에 위 네 요소가 모두 포함되며, React Native 측 코드에는 Gemini API 키나 `@google/generative-ai` 직접 호출이 존재하지 않는다.

### AC-E3-2 (REQ-E3-002): API 키 서버 측 보관·클라이언트 키 미보유
- **Given** 프로젝트 소스 전체(서버·클라이언트)가 주어졌을 때
- **When** Gemini API 키 리터럴과 클라이언트 측 키 사용을 검색하면
- **Then** 키 리터럴은 어디에도 존재하지 않고, `server/.env`에만 키 항목(플레이스홀더 `GEMINI_API_KEY=your-key-here`)이 있으며, `mobile/.env`에는 `API_BASE_URL`만 존재하고 Gemini 키가 없다.

### AC-E3-3 (REQ-E3-003): 서버 측 Gemini 호출·요청 검증
- **Given** 백엔드가 실행 중일 때
- **When** `POST /api/coaching`에 유효한 요청 본문이 전달되면
- **Then** `server/src/routes/coaching.ts`가 본문을 검증한 뒤 `server/src/services/GeminiService.ts`를 통해 `gemini-1.5-flash`를 호출하여 한국어 코칭 메시지를 JSON으로 반환하고, 본문이 유효하지 않으면 4xx 오류를 반환한다.

### AC-E3-4 (REQ-E3-004, E3-007): 코칭 표시·비차단
- **Given** `SessionSummaryScreen`에 진입했을 때
- **When** 백엔드 코칭 응답이 아직 도착하지 않았다면
- **Then** 통계는 즉시 표시되고 코칭 영역은 로딩 상태이며, 응답 도착 시 한국어 코칭 메시지로 채워진다.

### AC-E3-5 (REQ-E3-005, E3-006): 서버 미도달/실패 fallback
- **Given** 백엔드 서버가 도달 불가하거나 호출이 예외/오류 응답을 던지는 상황이 주어졌을 때
- **When** 세션 요약 화면에서 코칭을 시도하면
- **Then** 앱이 멈추지 않고 규칙 기반 한국어 요약 메시지가 코칭 영역에 표시되며, AI 코칭 없이도 핵심 통계 표시가 모두 정상 동작한다.

## 엣지 케이스 (Edge Cases)

- 세션 중 운동을 전환하지 않음(라우트 파라미터로 단일 운동 고정) — 운동 전환 시나리오는 범위 외.
- 일부 프레임에서 일부 관절 각도가 `undefined`(가시성 부족) — 평균 계산 시 `undefined` 샘플은 제외하고 안전 처리.
- rep 임계값 경계에서의 떨림(노이즈) — 히스테리시스(상·하 임계값 분리)로 중복 카운트 방지.
- Gemini 응답이 빈 문자열/매우 짧음 — fallback 또는 응답 그대로 표시(충돌 없음).
- 매우 긴 세션의 시계열 메모리 — MVP 인메모리 허용 규모 가정, 필요 시 샘플링.

## 품질 게이트 (Quality Gates)

- 테스트 커버리지: 신규/수정 서비스(`JointAngleCalculator`, `FeedbackGenerator`, `SessionAnalyticsService`, `AICoachingService`) 및 백엔드 라우트(`server/src/routes/coaching.ts`) 단위 테스트 통과, 프로젝트 커버리지 기준 충족.
- 타입: `tsc --noEmit` 무오류, `any` 미사용(`unknown` 우선).
- 린트: ESLint 무경고.
- 회귀: 기존 SPEC-UI-001/002 테스트 전부 통과.
- 보안: API 키 하드코딩 0건(전수 검사).
- 잔존물: 소스 내 `void exercise` 0건.

## Definition of Done

- [ ] REQ-E1-001~007 모두 구현 및 AC-E1-* 통과
- [ ] REQ-E2-001~008 모두 구현 및 AC-E2-* 통과
- [ ] REQ-E3-001~007 모두 구현 및 AC-E3-* 통과
- [ ] `void exercise` 전수 제거 확인
- [ ] mock `frameProcessor` 미수정 확인
- [ ] 모든 UI 텍스트·코드 주석 한국어
- [ ] API 키 비하드코딩 확인, Gemini 키는 `server/.env`에만 존재(클라이언트 미보유), `.env` 파일은 플레이스홀더만 포함
- [ ] 세션 분석 데이터 비영속(persist 미적용) 확인
- [ ] 전체 흐름(운동 선택 → 세션 → 종료 → 요약 → 코칭/fallback) 정상 동작
- [ ] TRUST 5 품질 게이트 통과
