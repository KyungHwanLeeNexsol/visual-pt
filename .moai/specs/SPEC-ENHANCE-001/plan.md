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

# SPEC-ENHANCE-001 구현 계획 (plan.md)

## 기술 접근 (Technical Approach)

본 향상은 기존 SPEC-UI-001/002 파이프라인을 **확장만** 하며 타입 계약을 깨지 않는다. 세 기능은 다음 의존 순서를 가진다:

```
Feature 1 (운동별 분기) ──┐
                          ├──> Feature 2 (세션 분석) ──> Feature 3 (Gemini 코칭)
pose.config / feedback ───┘        (E2 요약이 E3 입력)
```

- **Feature 1**은 순수 함수/설정 변경으로 가장 독립적이며 먼저 완료한다.
- **Feature 2**는 F1의 운동별 각도 출력에 의존하며, rep 카운트 상태 머신과 요약 통계, 신규 화면·라우트를 도입한다.
- **Feature 3**은 F2의 세션 요약 객체를 입력으로 받아 **백엔드 프록시 서버**(`server/`, Express.js)를 호출하고, 서버가 Gemini API를 호출한다. 신규 서버 컴포넌트 + 외부 API 의존이 가장 크므로 마지막에 통합한다.

### 핵심 설계 결정

1. **운동별 분기 전략(F1):** `calculateAngles`/`generateMessages` 내부에 `switch(exercise)` 분기를 두되, 공통 계산은 헬퍼로 유지하고 운동별 차이만 분기한다. 미지원 운동은 `default` 분기에서 기존 공통 동작으로 폴백(REQ-E1-007).
2. **운동별 피드백 매핑(F1):** `feedback.config.ts`에 기존 공통 `FEEDBACK_MESSAGES`를 보존하고, 운동별 오버라이드 맵 `EXERCISE_FEEDBACK_MESSAGES[exercise][errorType]`을 추가한다. 운동별 항목이 없으면 공통으로 폴백 → 하위 호환 보장.
3. **rep 카운트 상태 머신(F2):** `SessionAnalyticsService` 내부에 운동별 단순 2-상태 머신(`down`/`up`)을 둔다. 임계값 히스테리시스(상·하 임계값 분리)로 노이즈에 의한 중복 카운트를 방지한다.
4. **인메모리 전용(F2):** `sessionAnalyticsStore`는 Zustand `persist` 미들웨어를 사용하지 않는다. 새 세션 시작 시 `reset()`으로 초기화.
5. **백엔드 프록시 아키텍처(F3):** Gemini API 키를 클라이언트에 노출하지 않기 위해 전용 Express.js + TypeScript 서버(`server/`)를 둔다. 서버는 `POST /api/coaching` 단일 엔드포인트를 노출하고, 요청 본문을 검증한 뒤 `server/.env`의 키로 Gemini를 호출하여 코칭 메시지를 반환한다. React Native 클라이언트는 `AICoachingService`(구 `GeminiCoachingService`)를 통해 `${API_BASE_URL}/api/coaching`만 호출한다.
6. **비차단 호출(F3):** `SessionSummaryScreen` 진입 시 통계는 즉시 렌더링하고, 백엔드 호출은 `useEffect` 비동기로 트리거하여 응답 도착 시 상태 갱신. 서버 미도달/실패 시 즉시 fallback 텍스트로 전환.

## 마일스톤 (우선순위 기반, 시간 추정 없음)

### M1 — Feature 1: 운동별 각도 정교화 (Priority: High)
- `pose.config.ts` 운동별 임계값 정교화 + 근거 주석 (REQ-E1-006)
- `feedback.config.ts` 운동별 메시지 맵 추가 (REQ-E1-005)
- `JointAngleCalculator.ts` `void exercise` 제거 + 운동별 분기 (REQ-E1-001, E1-003, E1-004, E1-007)
- `FeedbackGenerator.ts` `void exercise` 제거 + 운동별 메시지 선택 (REQ-E1-002)
- 완료 조건: 기존 `JointAngleCalculator.test.ts` / `FeedbackGenerator.test.ts` 통과 + 운동별 분기 신규 테스트 추가

### M2 — Feature 2: 세션 분석 + 요약 화면 (Priority: High, M1 의존)
- `SessionAnalyticsService.ts` 신규: 시계열 누적, 운동별 rep 카운트, 요약 통계 (REQ-E2-001~004)
- `sessionAnalyticsStore.ts` 신규: 인메모리 상태, reset (REQ-E2-005)
- `navigation/types.ts` + `RootNavigator.tsx`: `SessionSummary` 라우트 등록 (REQ-E2-007)
- `SessionSummaryScreen.tsx` 신규: 통계/차트 + 빈 데이터 처리 (REQ-E2-006, E2-008)
- `CameraScreen.tsx`: 세션 종료 시 `goBack()` → `SessionSummary` 내비게이트로 교체 (REQ-E2-006)
- 완료 조건: rep 카운트·요약 통계 단위 테스트 통과, 요약 화면 렌더 테스트 통과

### M3 — Feature 3: Gemini AI 코칭 (백엔드 프록시) (Priority: High, M2 의존)
- **백엔드 서버 구성**: `server/package.json`, `server/tsconfig.json`, `server/.env`(템플릿 `GEMINI_API_KEY=your-key-here`) (REQ-E3-002)
- `server/src/index.ts`: Express 서버 진입점, `POST /api/coaching` 라우트 마운트 (REQ-E3-003)
- `server/src/routes/coaching.ts`: 요청 검증 + 핸들러 (REQ-E3-003)
- `server/src/services/GeminiService.ts`: 프롬프트 구성, `gemini-1.5-flash` 호출 래퍼 (REQ-E3-003)
- **클라이언트 측**: `mobile/.env`에 `API_BASE_URL=http://localhost:3001` + `types/env.d.ts` (REQ-E3-002)
- `mobile/src/services/AICoachingService.ts`(구 `GeminiCoachingService.ts`): 백엔드 `/api/coaching` 호출, fallback (REQ-E3-001, E3-005)
- `SessionSummaryScreen.tsx`: 코칭 영역 + 로딩/실패 상태 (REQ-E3-004, E3-006, E3-007)
- 완료 조건: 서버 라우트 단위 테스트(검증/성공/실패) + 클라이언트 코칭 서비스 단위 테스트(성공/실패 경로) 통과, fallback 동작 검증

### M4 — 통합 검증 (Priority: Medium)
- 전체 흐름: 운동 선택 → 카메라 세션 → 종료 → 요약 화면 → 코칭 표시
- `void exercise` 잔존 여부 전수 검사
- TRUST 5 게이트, 커버리지 확인

## 파일 변경 계획

### 수정 (Modify)
| 파일 | 변경 내용 | 관련 REQ |
|------|----------|---------|
| `mobile/src/config/pose.config.ts` | 운동별 임계값 정교화 + 근거 주석 | E1-006 |
| `mobile/src/config/feedback.config.ts` | 운동별 메시지 맵 추가 | E1-005 |
| `mobile/src/services/JointAngleCalculator.ts` | `void exercise` 제거, 운동별 분기 | E1-001, E1-003, E1-004, E1-007 |
| `mobile/src/services/FeedbackGenerator.ts` | `void exercise` 제거, 운동별 메시지 선택 | E1-002 |
| `mobile/src/screens/CameraScreen.tsx` | 종료 시 요약 화면 내비게이트 + 분석 데이터 적재 연결 | E2-001, E2-006 |
| `mobile/src/navigation/types.ts` | `SessionSummary` 라우트 타입 추가 | E2-007 |
| `mobile/src/navigation/RootNavigator.tsx` | `SessionSummary` 화면 등록 | E2-007 |

### 생성 (Create)
| 파일 | 역할 | 관련 REQ |
|------|------|---------|
| `mobile/src/services/SessionAnalyticsService.ts` | 시계열 누적·rep 카운트·요약 통계 | E2-001~004 |
| `mobile/src/services/AICoachingService.ts` | 백엔드 `/api/coaching` 호출·fallback (구 `GeminiCoachingService.ts`) | E3-001, E3-005 |
| `mobile/src/store/sessionAnalyticsStore.ts` | 인메모리 분석 상태 | E2-005 |
| `mobile/src/screens/SessionSummaryScreen.tsx` | 요약·통계·코칭 표시 | E2-006, E2-008, E3-004, E3-006 |
| `mobile/.env` | `API_BASE_URL=http://localhost:3001` (Gemini 키 없음) | E3-002 |
| `mobile/src/types/env.d.ts` | 환경 변수 타입 선언 | E3-002 |
| `server/package.json` | 백엔드 서버 의존성·스크립트 정의 | E3-003 |
| `server/tsconfig.json` | 백엔드 TypeScript 설정 | E3-003 |
| `server/.env` | 서버 측 Gemini API 키 (템플릿 `GEMINI_API_KEY=your-key-here`) | E3-002 |
| `server/src/index.ts` | Express 서버 진입점, 라우트 마운트 | E3-003 |
| `server/src/routes/coaching.ts` | `POST /api/coaching` 요청 검증·핸들러 | E3-003 |
| `server/src/services/GeminiService.ts` | Gemini API 래퍼(`gemini-1.5-flash` 호출) | E3-003 |

## 의존성 (외부 패키지)
### 백엔드 (`server/`)
- `express` — HTTP 서버 프레임워크 (신규)
- `@google/generative-ai` — Gemini 클라이언트, **서버 측에만 설치** (신규)
- `typescript`, `ts-node`(또는 `tsx`), `@types/express`, `@types/node` — TypeScript 개발 의존성 (신규)
- `dotenv` — `server/.env` 로딩 (신규, 또는 Node 기본 `--env-file` 사용 검토)

### 클라이언트 (`mobile/`)
- `react-native-config` — `mobile/.env`의 `API_BASE_URL` 주입 (신규 설치 필요, 네이티브 링크 검토). Gemini 키는 클라이언트에 없음.
- 백엔드 호출: 기존 `fetch` 사용(신규 패키지 불필요)
- 차트 표시: 기존 RN 컴포넌트 또는 경량 차트 라이브러리 중 택1 (M2에서 결정; 미설치 시 단순 통계 텍스트/바로 대체 가능)

## 위험 및 완화 (Risks & Mitigations)

| 위험 | 영향 | 완화 |
|------|------|------|
| mock frameProcessor로 인해 rep 카운트를 실기기 없이 검증 불가 | 통합 테스트 한계 | 서비스 단위 테스트는 합성 시계열 입력으로 검증; 인터페이스는 실제 데이터와 동일 |
| 백엔드 서버 미실행 또는 `API_BASE_URL` 주소 불일치(에뮬레이터/실기기 호스트) | AI 코칭 미동작 | 서버 미도달 → fallback 경로(REQ-E3-005)로 graceful degradation |
| 서버 측 `GEMINI_API_KEY` 누락/무효 | AI 코칭 미동작 | 서버가 오류 반환 → 클라이언트 fallback(REQ-E3-005)으로 처리 |
| Gemini 응답 지연/타임아웃 | 화면 체감 지연 | 비차단 호출(REQ-E3-007), 통계 우선 렌더, 코칭은 후속 갱신 |
| 운동별 분기 도입으로 기존 동작 회귀 | SPEC-UI-001 깨짐 | 기존 테스트 유지 + 공통 폴백 보존(REQ-E1-007), 특성화 테스트로 회귀 감지 |
| 장시간 세션 시 시계열 메모리 증가 | 메모리 압박 | 필요 시 샘플링 간격 적용; MVP는 in-memory 허용 규모 가정 |

## 방법론
- `quality.yaml`의 `development_mode`를 따른다(기본 TDD). 기존 코드 수정(F1)은 brownfield TDD(기존 동작 이해 → 실패 테스트 → 최소 구현 → 리팩터)로 진행.
